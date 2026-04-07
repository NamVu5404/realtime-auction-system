package com.namvu.realtimeauctionsystem.modules.bid.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidEvent;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaGroup.BID_PROCESSOR_GROUP;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaTopic.BID_EVENTS_TOPIC;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.AUCTION_TOPIC_PREFIX;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidEventConsumerV2 {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final RedisAuctionService redisAuctionService;

    @KafkaListener(topics = BID_EVENTS_TOPIC, groupId = BID_PROCESSOR_GROUP)
    public void consumeBidEvent(
            ConsumerRecord<String, String> consumerRecord,
            Acknowledgment ack
    ) {
        try {
            BidEvent event = objectMapper.readValue(consumerRecord.value(), BidEvent.class);

            // Broadcast thông tin giá mới qua WebSocket (chung phòng đấu giá)
            messagingTemplate.convertAndSend(
                    AUCTION_TOPIC_PREFIX + event.getAuctionId(),
                    event
            );

            // Manual commit sau khi xử lý thành công
            ack.acknowledge();

            String title = redisAuctionService.getAuctionTitle(event.getAuctionId());
            BigDecimal currentPrice = redisAuctionService.getCurrentPrice(event.getAuctionId());
            notificationService.processBidNotifications(event, title, currentPrice);

        } catch (Exception e) {
            log.error("Failed to process bid event at offset {}: {}", consumerRecord.offset(), e.getMessage());
            // Không ack → Kafka retry
        }
    }
}
