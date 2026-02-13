package com.NamVu.realtimeauctionsystem.scheduler;

import com.NamVu.realtimeauctionsystem.repository.InvalidatedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@Slf4j
@RequiredArgsConstructor
public class InvalidTokenCleanupJob {

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void cleanUpInvalidToken() {
        log.info("Starting InvalidToken cleanup job...");

        invalidatedTokenRepository.deleteByExpiryTimeBefore(Instant.now());
    }
}
