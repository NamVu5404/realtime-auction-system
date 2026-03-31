package com.namvu.realtimeauctionsystem.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
import com.namvu.realtimeauctionsystem.modules.bid.repository.BidRepository;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import com.namvu.realtimeauctionsystem.modules.bid.service.OutboxService;
import com.namvu.realtimeauctionsystem.modules.bid.service.RedisLuaService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class BidServiceTest {

    @Autowired
    private BidService bidService;

    @MockBean
    private RedisLuaService redisLuaService;

    @MockBean
    private BidRepository bidRepository;

    @MockBean
    private OutboxService outboxService;

    @MockBean
    private AuctionService auctionService;
    
    @MockBean
    private UserService userService;

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

        // Định nghĩa hành vi mặc định cho các Service
        when(auctionService.getAuctionReference(AUCTION_ID)).thenReturn(mockAuction);
        when(userService.getUserReference(BIDDER_ID)).thenReturn(mockUser);
    }

    // ✅ Test happy path
    @Test
    void testPlaceBidSuccess() throws JsonProcessingException {
        // Mock Lua return success
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "normal", "1234567890", 0L, "999", "888"));

        when(auctionService.applyBid(anyLong(), any(BigDecimal.class), anyLong(), any(Instant.class), any(Integer.class)))
                .thenReturn(1);

        BidUpdateResult result = bidService.placeBidV2(AUCTION_ID, BIDDER_ID, new BigDecimal("1200"));

        assertTrue(result.isSuccess());

        verify(auctionService, times(1)).applyBid(
                eq(AUCTION_ID),
                eq(new BigDecimal("1200")),
                eq(BIDDER_ID),
                any(Instant.class),
                any(Integer.class)
        );
        
        verify(bidRepository, times(1)).save(any());
        verify(outboxService, times(1)).save(any(), any(), anyBoolean(), any(), anyLong(), anyLong());
        verify(auctionService, times(1)).getAuctionReference(AUCTION_ID);
    }

    // ❌ Test Lua reject
    @Test
    void testPlaceBidRejected() throws JsonProcessingException {
        when(redisLuaService.executePlaceBid(any(), any(), any(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(0L, "Bid must be at least 1100"));

        BidUpdateResult result = bidService.placeBidV2(AUCTION_ID, BIDDER_ID, new BigDecimal("1050"));

        assertFalse(result.isSuccess());
        verify(bidRepository, never()).save(any());
        verify(outboxService, never()).save(any(), any(), anyBoolean(), any(), anyLong(), anyLong());
    }

    // ✅ Test extended bid
    @Test
    void testPlaceBidExtended() throws JsonProcessingException {
        // 1. Giả lập dữ liệu
        BigDecimal newPrice = new BigDecimal("1200");
        String newEndTimeStr = "1738572600";
        Long nextExtCount = 1L;

        // 2. Mock Lua: Trả về 5 phần tử để khớp với logic parse trong Service
        // Index: 0-Status, 1-Msg, 2-Flag, 3-EndTime, 4-Count
        when(redisLuaService.executePlaceBid(anyLong(), any(BigDecimal.class), anyLong(), anyLong(), anyInt()))
                .thenAnswer(invocation -> List.of(1L, "Success", "extended", newEndTimeStr, nextExtCount, "999", "888"));

        when(auctionService.applyBid(anyLong(), any(), anyLong(), any(), anyInt()))
                .thenReturn(1);

        // 3. Thực thi
        BidUpdateResult result = bidService.placeBidV2(AUCTION_ID, BIDDER_ID, newPrice);

        // 4. Kiểm chứng kết quả trả về
        assertTrue(result.isSuccess(), "Bid should be successful");
        assertTrue(result.isExtended(), "Bid should trigger anti-snipe extension");
        Assertions.assertEquals(newPrice, result.getNewPrice());

        // 5. Kiểm chứng việc lưu xuống Database qua Service
        verify(auctionService, times(1)).applyBid(
                eq(AUCTION_ID),
                eq(newPrice),
                eq(BIDDER_ID),
                argThat(time -> time.getEpochSecond() == Long.parseLong(newEndTimeStr)),
                eq(nextExtCount.intValue())
        );

        // 6. Kiểm chứng Outbox Pattern nhận đúng cờ extended = true
        verify(outboxService, times(1)).save(any(), any(), eq(true), any(), anyLong(), anyLong());

        // Đảm bảo không lưu bid nếu transaction fail
        verify(bidRepository, times(1)).save(any());
    }
}