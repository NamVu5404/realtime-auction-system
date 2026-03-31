package com.namvu.realtimeauctionsystem.modules.auction.scheduler;

import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

import static com.namvu.realtimeauctionsystem.common.constant.AuctionStatus.LIVE;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionReconciliationJob {

    private final AuctionRepository auctionRepository;
    private final RedisAuctionService redisAuctionService;

    @Scheduled(fixedDelay = 60000)  // Mỗi 1 phút
    public void reconcileActiveAuctions() {
        List<Auction> active = auctionRepository.findByStatus(LIVE);

        for (Auction auction : active) {
            BigDecimal redisPrice = redisAuctionService.getCurrentPrice(auction.getId());
            BigDecimal mysqlPrice = auction.getCurrentPrice();

            if (redisPrice.compareTo(mysqlPrice) != 0) {
                log.warn("Mismatch auction {}: Redis={}, MySQL={}", auction.getId(), redisPrice, mysqlPrice);

                // Fix Redis = MySQL (source of truth)
                redisAuctionService.syncFromDatabase(auction);
            }
        }
    }
}
