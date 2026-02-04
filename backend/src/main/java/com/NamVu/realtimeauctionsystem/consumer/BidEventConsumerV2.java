package com.NamVu.realtimeauctionsystem.consumer;

import com.NamVu.realtimeauctionsystem.dto.BidEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.kafka.support.Acknowledgment;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidEventConsumerV2 {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "bid-events", groupId = "auction-db-sync-group")
    public void consumeBidEvent(
            ConsumerRecord<String, String> record,
            Acknowledgment ack
    ) {
        try {
            BidEvent event = objectMapper.readValue(record.value(), BidEvent.class);

            // Broadcast qua WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/auction/" + event.getAuctionId(),
                    event
            );

            // Manual commit sau khi xử lý thành công
            ack.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process bid event at offset {}: {}",
                    record.offset(), e.getMessage());
            // Không ack → Kafka retry
        }
    }
}
