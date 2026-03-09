package com.namvu.realtimeauctionsystem.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.entity.Bid;
import com.namvu.realtimeauctionsystem.entity.Outbox;
import com.namvu.realtimeauctionsystem.enums.OutboxEventType;
import com.namvu.realtimeauctionsystem.enums.OutboxStatus;
import com.namvu.realtimeauctionsystem.repository.OutboxRepository;
import com.namvu.realtimeauctionsystem.service.OutboxService;
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
    private final ObjectMapper objectMapper;

    @Override
    public void save(Long auctionId, Bid bid, boolean extended, Instant finalEndTime) throws JsonProcessingException {
        Map<String, Object> payload = Map.of(
                "auctionId", auctionId,
                "bidderId", bid.getBidder().getId(),
                "bidderName", bid.getBidder().getName(),
                "amount", bid.getAmount(),
                "extended", extended,
                "finalEndTime", finalEndTime,
                "timestamp", bid.getCreatedAt().getEpochSecond()
        );

        Outbox outbox = Outbox.builder()
                .eventType(OutboxEventType.BID_PLACED)
                .auctionId(auctionId)
                .payload(objectMapper.writeValueAsString(payload))
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .build();

        outboxRepository.save(outbox);
    }
}
