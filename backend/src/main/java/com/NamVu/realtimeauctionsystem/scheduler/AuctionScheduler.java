package com.NamVu.realtimeauctionsystem.scheduler;

import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.enums.AuctionStatus;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class AuctionScheduler {

    private final AuctionRepository auctionRepository;
    private final RedisAuctionService redisAuctionService;

    /**
     * Chạy mỗi 1 giây, tìm auctions cần start
     */
    @Scheduled(fixedDelay = 1000) // 1 seconds
    public void startScheduledAuctions() {
        Instant now = Instant.now();

        // Tìm auctions: SCHEDULED + startTime <= now
        List<Auction> auctionsToStart = auctionRepository
                .findByStatusAndStartTimeLessThanEqual(AuctionStatus.SCHEDULED, now);

        if (auctionsToStart.isEmpty()) {
            return;
        }

        log.info("Starting {} scheduled auctions", auctionsToStart.size());

        for (Auction auction : auctionsToStart) {
            try {
                // Update status to LIVE
                auction.setStatus(AuctionStatus.LIVE);
                auctionRepository.save(auction);

                // Init Redis
                redisAuctionService.initAuction(
                        auction.getId(),
                        auction.getStartPrice(),
                        auction.getMinStep(),
                        auction.getSeller().getId(),
                        auction.getEndTime(),
                        auction.getAntiSnipeSeconds(),
                        auction.getExtensionSeconds()
                );

                log.info("Auction {} started and initialized in Redis", auction.getId());

            } catch (Exception e) {
                log.error("Failed to start auction {}", auction.getId(), e);
            }
        }
    }

    /**
     * Chạy mỗi 1 giây, tìm auctions cần end
     */
    @Scheduled(fixedDelay = 1000)
    public void endLiveAuctions() {
        Instant now = Instant.now();

        // Tìm auctions: LIVE + endTime <= now
        List<Auction> auctionsToEnd = auctionRepository
                .findByStatusAndEndTimeLessThanEqual(AuctionStatus.LIVE, now);

        if (auctionsToEnd.isEmpty()) {
            return;
        }

        log.info("Ending {} live auctions", auctionsToEnd.size());

        for (Auction auction : auctionsToEnd) {
            try {
                // Update status to ENDED
                auction.setStatus(AuctionStatus.ENDED);
                auctionRepository.save(auction);

                // Update Redis status
                redisAuctionService.updateStatus(auction.getId(), "ENDED");

                log.info("Auction {} ended", auction.getId());

            } catch (Exception e) {
                log.error("Failed to end auction {}", auction.getId(), e);
            }
        }
    }
}
