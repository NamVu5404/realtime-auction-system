package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class BidServiceTest {

    @Autowired
    private BidService bidService;

    @MockBean
    private RedisLuaService redisLuaService;

    @MockBean
    private BidRepository bidRepository;

    @MockBean
    private OutboxService outboxService;

    // ✅ Test happy path
    @Test
    void testPlaceBidSuccess() {
        // Mock Lua return success
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "normal", "1234567890"));

        BidUpdateResult result = bidService.placeBid(1L, 100L, new BigDecimal("1200"));

        assertTrue(result.isSuccess());
        verify(bidRepository, times(1)).save(any());
        verify(outboxService, times(1)).save(any(), any(), anyBoolean());
    }

    // ❌ Test Lua reject
    @Test
    void testPlaceBidRejected() {
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(0L, "Bid must be at least 1100"));

        BidUpdateResult result = bidService.placeBid(1L, 100L, new BigDecimal("1050"));

        assertFalse(result.isSuccess());
        verify(bidRepository, never()).save(any());        // KHÔNG ghi DB
        verify(outboxService, never()).save(any(), any(), anyBoolean());
    }

    // ✅ Test extended bid
    @Test
    void testPlaceBidExtended() {
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "extended", "1234567890"));

        BidUpdateResult result = bidService.placeBid(1L, 100L, new BigDecimal("1200"));

        assertTrue(result.isSuccess());
        assertTrue(result.isExtended());
        verify(outboxService, times(1)).save(any(), any(), eq(true));  // extended = true
    }
}
