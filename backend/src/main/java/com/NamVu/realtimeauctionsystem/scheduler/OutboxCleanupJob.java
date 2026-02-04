package com.NamVu.realtimeauctionsystem.scheduler;

import com.NamVu.realtimeauctionsystem.repository.OutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxCleanupJob {

    private final OutboxRepository outboxRepository;

    private static final int BATCH_SIZE = 500; // Mỗi lô xóa 500 bản ghi
    private static final int MAX_DELETE_PER_RUN = 10000; // Không xóa quá 10k bản ghi mỗi lần chạy để tránh I/O cao

    @Scheduled(fixedDelay = 300000) // Chạy mỗi 5 phút
    public void cleanUpSentEvents() {
        int totalDeleted = 0;
        int deletedInStep;

        log.info("Starting Outbox cleanup job...");

        try {
            do {
                deletedInStep = outboxRepository.deleteSentRecordsBatch(BATCH_SIZE);
                totalDeleted += deletedInStep;
            } while (deletedInStep >= BATCH_SIZE && totalDeleted < MAX_DELETE_PER_RUN);

            if (totalDeleted > 0) {
                log.info("Cleanup Job: Successfully deleted {} 'SENT' records.", totalDeleted);
            }
        } catch (Exception e) {
            log.error("Cleanup Job Error: Failed to delete processed events. Error: {}", e.getMessage());
        }
    }
}
