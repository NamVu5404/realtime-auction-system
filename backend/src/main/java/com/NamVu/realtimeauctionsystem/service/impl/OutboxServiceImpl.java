package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.Outbox;
import com.NamVu.realtimeauctionsystem.enums.OutboxEventType;
import com.NamVu.realtimeauctionsystem.enums.OutboxStatus;
import com.NamVu.realtimeauctionsystem.repository.OutboxRepository;
import com.NamVu.realtimeauctionsystem.service.OutboxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxServiceImpl implements OutboxService {

    private final OutboxRepository outboxRepository;

    @Override
    public void save(Long auctionId, Bid bid, boolean extended) {
        Map<String, Object> payload = Map.of(
                "auctionId", auctionId,
                "bidderId", bid.getBidder().getId(),
                "amount", bid.getAmount(),
                "extended", extended,
                "timestamp", bid.getCreatedAt()
        );

        Outbox outbox = Outbox.builder()
                .eventType(OutboxEventType.BID_PLACED)
                .auctionId(auctionId)
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(Instant.now())
                .build();

        outboxRepository.save(outbox);
    }
}
