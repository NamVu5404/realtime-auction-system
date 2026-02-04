package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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

    @MockBean
    private AuctionRepository auctionRepository;

    @MockBean
    private UserRepository userRepository;

    // Khai báo hằng số để dùng chung cho các test case
    private final Long AUCTION_ID = 1L;
    private final Long BIDDER_ID = 100L;

    @BeforeEach
    void setUp() {
        // Tạo Auction giả lập
        Auction mockAuction = new Auction();
        mockAuction.setId(AUCTION_ID);
        mockAuction.setCurrentPrice(new BigDecimal("1000"));

        // Tạo User giả lập
        User mockUser = new User();
        mockUser.setId(BIDDER_ID);

        // Định nghĩa hành vi mặc định cho các Repository
        when(auctionRepository.findById(AUCTION_ID)).thenReturn(Optional.of(mockAuction));
        when(userRepository.getReferenceById(BIDDER_ID)).thenReturn(mockUser);
    }

    // ✅ Test happy path
    @Test
    void testPlaceBidSuccess() throws JsonProcessingException {
        // Mock Lua return success
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "normal", "1234567890"));

        BidUpdateResult result = bidService.placeBid(AUCTION_ID, BIDDER_ID, new BigDecimal("1200"));

        assertTrue(result.isSuccess());
        verify(auctionRepository, times(1)).save(any(Auction.class)); // Kiểm tra update auction
        verify(bidRepository, times(1)).save(any());
        verify(outboxService, times(1)).save(any(), any(), anyBoolean());
    }

    // ❌ Test Lua reject
    @Test
    void testPlaceBidRejected() throws JsonProcessingException {
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(0L, "Bid must be at least 1100"));

        BidUpdateResult result = bidService.placeBid(AUCTION_ID, BIDDER_ID, new BigDecimal("1050"));

        assertFalse(result.isSuccess());
        verify(auctionRepository, never()).save(any()); // KHÔNG update auction khi thất bại
        verify(bidRepository, never()).save(any());
        verify(outboxService, never()).save(any(), any(), anyBoolean());
    }

    // ✅ Test extended bid
    @Test
    void testPlaceBidExtended() throws JsonProcessingException {
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "extended", "1234567890"));

        BidUpdateResult result = bidService.placeBid(AUCTION_ID, BIDDER_ID, new BigDecimal("1200"));

        assertTrue(result.isSuccess());
        assertTrue(result.isExtended());
        verify(outboxService, times(1)).save(any(), any(), eq(true));
    }
}