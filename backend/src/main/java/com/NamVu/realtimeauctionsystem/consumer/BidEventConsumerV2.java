package com.namvu.realtimeauctionsystem.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.dto.bid.BidEvent;
import com.namvu.realtimeauctionsystem.enums.NotificationType;
import com.namvu.realtimeauctionsystem.service.NotificationService;
import com.namvu.realtimeauctionsystem.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.utils.MoneyUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

import static com.namvu.realtimeauctionsystem.enums.KafkaTopicConstant.BID_EVENTS_TOPIC;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidEventConsumerV2 {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final RedisAuctionService redisAuctionService;

    @KafkaListener(topics = BID_EVENTS_TOPIC, groupId = "auction-db-sync-group")
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

            handlePushNotification(event);

            // Manual commit sau khi xử lý thành công
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process bid event at offset {}: {}", consumerRecord.offset(), e.getMessage());
            // Không ack → Kafka retry
        }
    }

    private void handlePushNotification(BidEvent event) {
        String title = redisAuctionService.getAuctionTitle(event.getAuctionId());
        BigDecimal currentPrice = redisAuctionService.getCurrentPrice(event.getAuctionId());

        // Xử lý gửi Notification: OUTBID
        // Chỉ gửi khi có người từng dẫn đầu trước đó và không phải tự outbid chính mình
        if (event.getPreviousBidderId() != null && event.getPreviousBidderId() > 0
                && !event.getPreviousBidderId().equals(event.getBidderId())) {

            NotificationType type = NotificationType.OUTBID;
            String content = type.buildContent(title, MoneyUtils.format(currentPrice));
            String redirectUrl = type.buildRedirectUrl(event.getAuctionId());

            notificationService.createAndPushNotification(event.getPreviousBidderId(), type, content, redirectUrl);
        }

        // Xử lý gửi Notification: BID_PLACED (Chỉ gửi cho người bán - Seller)
        if (event.getSellerId() != null && event.getSellerId() > 0
                && !event.getSellerId().equals(event.getBidderId())) {

            NotificationType type = NotificationType.BID_PLACED;
            String content = type.buildContent(title, MoneyUtils.format(currentPrice));
            String redirectUrl = type.buildRedirectUrl(event.getAuctionId());

            notificationService.createAndPushNotification(event.getSellerId(), type, content, redirectUrl);
        }
    }
}
