package com.NamVu.realtimeauctionsystem.scheduler;

import com.NamVu.realtimeauctionsystem.entity.Outbox;
import com.NamVu.realtimeauctionsystem.enums.OutboxStatus;
import com.NamVu.realtimeauctionsystem.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String TOPIC = "bid-events";
    private static final int BATCH_SIZE = 100;

    @Scheduled(fixedDelay = 1000) // Poll mỗi 1 giây
    public void pollAndPublish() {
        List<Outbox> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc(
                OutboxStatus.PENDING,
                PageRequest.of(0, BATCH_SIZE)
        );

        if (pendingEvents.isEmpty()) return;

        for (Outbox outbox : pendingEvents) {
            try {
                kafkaTemplate.send(
                        TOPIC,
                        String.valueOf(outbox.getAuctionId()),
                        outbox.getPayload().toString()
                );
                outbox.markSent();

            } catch (Exception e) {
                log.error("Failed to send event {}: {}", outbox.getId(), e.getMessage());
                outbox.markFailed();
            }

            outboxRepository.save(outbox);
        }

        log.info("Processed {} outbox events", pendingEvents.size());
    }
}
