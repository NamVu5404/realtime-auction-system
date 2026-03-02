package com.namvu.realtimeauctionsystem.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.dto.bid.BidEvent;
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

    @KafkaListener(topics = "bid-events", groupId = "auction-db-sync-group")
    public void consumeBidEvent(
            ConsumerRecord<String, String> consumerRecord,
            Acknowledgment ack
    ) {
        try {
            BidEvent event = objectMapper.readValue(consumerRecord.value(), BidEvent.class);

            // Broadcast qua WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/auction/" + event.getAuctionId(),
                    event
            );

            // Manual commit sau khi xử lý thành công
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process bid event at offset {}: {}",
                    consumerRecord.offset(), e.getMessage());
            // Không ack → Kafka retry
        }
    }
}
