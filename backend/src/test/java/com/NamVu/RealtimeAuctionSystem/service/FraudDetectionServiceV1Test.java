package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.auction.FraudCheckResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.FraudType;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.service.impl.FraudDetectionServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FraudDetectionServiceV1Test {

    @Mock
    private BidRepository bidRepository;

    @InjectMocks
    private FraudDetectionServiceImpl fraudDetectionServiceImpl;

    @Test
    @DisplayName("Should detect self-bidding")
    void shouldDetectSelfBidding() {
        // Given
        User seller = User.builder().id(1L).build();
        Auction auction = Auction.builder()
                .id(1L)
                .seller(seller)
                .currentPrice(new BigDecimal("1000.00"))
                .minStep(new BigDecimal("50.00"))
                .build();

        Bid bid = Bid.builder()
                .bidder(seller) // Same as seller
                .amount(new BigDecimal("1050.00"))
                .build();

        // When
        FraudCheckResult result = fraudDetectionServiceImpl.checkBid(bid, auction, auction.getCurrentPrice());

        // Then
        assertTrue(result.isHighRisk());
        assertEquals(FraudType.SELF_BIDDING, result.getPrimaryViolation());
    }

    @Test
    @DisplayName("Should detect rate limit violation")
    void shouldDetectRateLimit() {
        // Given
        User bidder = User.builder().id(2L).build();
        Auction auction = Auction.builder()
                .id(1L)
                .seller(User.builder().id(1L).build())
                .currentPrice(new BigDecimal("1000.00"))
                .minStep(new BigDecimal("50.00"))
                .build();

        Bid bid = Bid.builder()
                .bidder(bidder)
                .amount(new BigDecimal("1050.00"))
                .build();

        // Mock: 15 bids trong 60s
        when(bidRepository.countRecentBids(any(), any(), any())).thenReturn(15);

        // When
        FraudCheckResult result = fraudDetectionServiceImpl.checkBid(bid, auction, auction.getCurrentPrice());

        // Then
        assertTrue(result.isHighRisk());
        assertTrue(result.getViolations().stream()
                .anyMatch(v -> v.getType() == FraudType.RATE_LIMIT));
    }

    @Test
    @DisplayName("Should detect price spike")
    void shouldDetectPriceSpike() {
        // Given
        User bidder = User.builder().id(2L).build();
        Auction auction = Auction.builder()
                .id(1L)
                .seller(User.builder().id(1L).build())
                .currentPrice(new BigDecimal("1000.00"))
                .minStep(new BigDecimal("50.00"))
                .build();

        Bid bid = Bid.builder()
                .bidder(bidder)
                .amount(new BigDecimal("1600.00")) // +600 = 12x minStep
                .build();

        when(bidRepository.countRecentBids(any(), any(), any())).thenReturn(5);

        // When
        FraudCheckResult result = fraudDetectionServiceImpl.checkBid(bid, auction, auction.getCurrentPrice());

        // Then
        assertTrue(result.isMediumRisk());
        assertTrue(result.getViolations().stream()
                .anyMatch(v -> v.getType() == FraudType.PRICE_SPIKE));
    }
}
