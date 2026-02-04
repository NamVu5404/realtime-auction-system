package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.entity.Outbox;
import com.NamVu.realtimeauctionsystem.enums.OutboxEventType;
import com.NamVu.realtimeauctionsystem.enums.OutboxStatus;
import com.NamVu.realtimeauctionsystem.repository.OutboxRepository;
import com.NamVu.realtimeauctionsystem.scheduler.OutboxPoller;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class OutboxPollerTest {

    @Autowired
    private OutboxPoller outboxPoller;

    @MockBean
    private OutboxRepository outboxRepository;

    @MockBean
    private KafkaTemplate<String, String> kafkaTemplate;

    // ✅ Test poll + send thành công
    @Test
    void testPollAndPublishSuccess() {
        Outbox outbox = Outbox.builder()
                .id(1L)
                .eventType(OutboxEventType.BID_PLACED)
                .auctionId(1L)
                .payload(Map.of("auctionId", 1))
                .status(OutboxStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(outboxRepository.findByStatusOrderByCreatedAtAsc(
                eq(OutboxStatus.PENDING),
                any())
        ).thenReturn(List.of(outbox));

        outboxPoller.pollAndPublish();

        verify(kafkaTemplate, times(1)).send(eq("bid-events"), eq("1"), any(String.class));
        assertEquals(OutboxStatus.SENT, outbox.getStatus());
    }

    // ❌ Test Kafka fail → retry
    @Test
    void testPollAndPublishKafkaFail() {
        Outbox outbox = Outbox.builder()
                .id(1L)
                .eventType(OutboxEventType.BID_PLACED)
                .auctionId(1L)
                .payload(Map.of("auctionId", 1))
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(Instant.now())
                .build();

        when(outboxRepository.findByStatusOrderByCreatedAtAsc(
                eq(OutboxStatus.PENDING), any())
        ).thenReturn(List.of(outbox));

        when(kafkaTemplate.send(any(), any(), any()))
                .thenThrow(new RuntimeException("Kafka down"));

        outboxPoller.pollAndPublish();

        assertEquals(1, outbox.getRetryCount());         // retry count tăng
        assertEquals(OutboxStatus.PENDING, outbox.getStatus());   // vẫn PENDING
    }

    // ❌ Test max retry → FAILED
    @Test
    void testPollAndPublishMaxRetry() {
        Outbox outbox = Outbox.builder()
                .id(1L)
                .eventType(OutboxEventType.BID_PLACED)
                .auctionId(1L)
                .payload(Map.of("auctionId", 1))
                .status(OutboxStatus.PENDING)
                .retryCount(4)                              // Lần thử thứ 5 sắp diễn ra
                .createdAt(Instant.now())
                .build();

        when(outboxRepository.findByStatusOrderByCreatedAtAsc(
                eq(OutboxStatus.PENDING), any())
        ).thenReturn(List.of(outbox));

        when(kafkaTemplate.send(any(), any(), any()))
                .thenThrow(new RuntimeException("Kafka down"));

        outboxPoller.pollAndPublish();

        assertEquals(5, outbox.getRetryCount());            // Tăng lên 5
        assertEquals(OutboxStatus.FAILED, outbox.getStatus());       // FAILED sau khi đạt ngưỡng
    }
}
