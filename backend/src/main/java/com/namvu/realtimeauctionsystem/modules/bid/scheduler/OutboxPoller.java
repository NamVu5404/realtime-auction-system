package com.namvu.realtimeauctionsystem.modules.bid.scheduler;

import com.namvu.realtimeauctionsystem.common.constant.OutboxStatus;
import com.namvu.realtimeauctionsystem.modules.bid.entity.Outbox;
import com.namvu.realtimeauctionsystem.modules.bid.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import static com.namvu.realtimeauctionsystem.common.constant.KafkaTopicConstant.BID_EVENTS_TOPIC;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPoller {

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final int BATCH_SIZE = 100;

    @Scheduled(fixedDelay = 500) // Poll mỗi 500ms
    public void pollAndPublish() {
        List<Outbox> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc(
                OutboxStatus.PENDING,
                PageRequest.of(0, BATCH_SIZE)
        );

        if (pendingEvents.isEmpty()) return;

        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (Outbox outbox : pendingEvents) {
            CompletableFuture<Void> future = kafkaTemplate
                    .send(BID_EVENTS_TOPIC, String.valueOf(outbox.getAuctionId()), outbox.getPayload())
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            outbox.markSent();
                        } else {
                            log.error("Failed to send event {}: {}", outbox.getId(), ex.getMessage());
                            outbox.markFailed();
                        }
                        outboxRepository.save(outbox);
                    })
                    .thenApply(result -> null);

            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        log.info("Processed {} outbox events", pendingEvents.size());
    }
}
