package com.namvu.realtimeauctionsystem.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.dto.bid.BidEvent;
import com.namvu.realtimeauctionsystem.dto.notification.NotificationResponse;
import com.namvu.realtimeauctionsystem.entity.Notification;
import com.namvu.realtimeauctionsystem.enums.NotificationConstant;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.repository.NotificationRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.utils.NotificationConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidEventConsumerV2 {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;

    @KafkaListener(topics = "bid-events", groupId = "auction-db-sync-group")
    public void consumeBidEvent(
            ConsumerRecord<String, String> consumerRecord,
            Acknowledgment ack
    ) {
        try {
            BidEvent event = objectMapper.readValue(consumerRecord.value(), BidEvent.class);

            // Broadcast thông tin giá mới qua WebSocket (chung phòng đấu giá)
            messagingTemplate.convertAndSend(
                    "/topic/auction/" + event.getAuctionId(),
                    event
            );

            String auctionTitle = auctionRepository.getAuctionTitleById(event.getAuctionId());

            // Xử lý gửi Notification: OUTBID
            // Chỉ gửi khi có người từng dẫn đầu trước đó và không phải tự outbid chính mình
            if (event.getPreviousBidderId() != null && event.getPreviousBidderId() > 0 
                    && !event.getPreviousBidderId().equals(event.getBidderId())) {
                
                String content = String.format(NotificationConstants.OUTBID_CONTENT, 
                                event.getBidderName(), event.getAmount());
                String redirectUrl = String.format(NotificationConstants.AUCTION_DETAIL_URL, event.getAuctionId());
                String metadata = "{\"auctionId\":" + event.getAuctionId() + ",\"newAmount\":" + event.getAmount() + "}";

                createAndSendNotification(event.getPreviousBidderId(), NotificationConstant.NotificationType.OUTBID, content, redirectUrl, metadata);
            }

            // Xử lý gửi Notification: BID_PLACED (Chỉ gửi cho người bán - Seller)
            if (event.getSellerId() != null && event.getSellerId() > 0 
                    && !event.getSellerId().equals(event.getBidderId())) {
                
                String content = String.format(NotificationConstants.BID_PLACED_CONTENT, 
                                auctionTitle, event.getAmount(), event.getBidderName());
                String redirectUrl = String.format(NotificationConstants.SELLER_AUCTION_DETAIL_URL, event.getAuctionId());
                String metadata = "{\"auctionId\":" + event.getAuctionId() + ",\"newAmount\":" + event.getAmount() + "}";

                createAndSendNotification(event.getSellerId(), NotificationConstant.NotificationType.BID_PLACED, content, redirectUrl, metadata);
            }

            // Manual commit sau khi xử lý thành công
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process bid event at offset {}: {}",
                    consumerRecord.offset(), e.getMessage());
            // Không ack → Kafka retry
        }
    }

    private void createAndSendNotification(Long recipientId, NotificationConstant.NotificationType type, String content, String redirectUrl, String metadata) {
        // Lưu vào Database
        Notification notification = Notification.builder()
                .recipient(userRepository.getReferenceById(recipientId))
                .type(type)
                .content(content)
                .metadata(metadata)
                .read(false)
                .redirectUrl(redirectUrl)
                .build();
        
        notification = notificationRepository.save(notification);

        // Chuyển thành DTO để push WebSocket
        NotificationResponse response = NotificationResponse.builder()
                .id(notification.getId())
                .userId(recipientId)
                .type(type)
                .content(content)
                .metadata(metadata)
                .read(false)
                .redirectUrl(redirectUrl)
                .createdAt(notification.getCreatedAt())
                .build();

        // Gửi WebSocket đích danh (Private topic)
        messagingTemplate.convertAndSend(
                "/user/" + recipientId + "/topic/notifications",
                response
        );
        
        log.info("Saved and pushed {} notification to user {}", type, recipientId);
    }
}
