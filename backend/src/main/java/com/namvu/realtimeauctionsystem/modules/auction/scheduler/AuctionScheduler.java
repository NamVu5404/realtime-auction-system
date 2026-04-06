package com.namvu.realtimeauctionsystem.modules.auction.scheduler;

import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.common.constant.AuctionActionType;
import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class AuctionScheduler {

    private final AuctionRepository auctionRepository;
    private final RedisAuctionService redisAuctionService;
    private final AuctionAuditRepository auctionAuditRepository;

    /**
     * Chạy mỗi 1 giây, tìm auctions cần start
     */
    @Scheduled(fixedDelay = 1000) // 1 seconds
    @Transactional
    @CacheEvict(value = CacheNameConstant.AUCTIONS, allEntries = true)
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
                auction = auctionRepository.save(auction);

                // Init Redis
                AuctionInitRequest request = AuctionInitRequest.builder()
                        .auctionId(auction.getId())
                        .title(auction.getTitle())
                        .startPrice(auction.getStartPrice())
                        .minStep(auction.getMinStep())
                        .sellerId(auction.getSeller().getId())
                        .endTime(auction.getEndTime())
                        .antiSnipeSeconds(auction.getAntiSnipeSeconds())
                        .extensionSeconds(auction.getExtensionSeconds())
                        .extensionCount(auction.getExtensionCount())
                        .build();

                redisAuctionService.initAuction(request);

                log.info("Auction {} started and initialized in Redis", auction.getId());

                // Ghi audit
                auctionAuditRepository.save(AuctionAudit.builder()
                        .auction(auction)
                        .actionType(AuctionActionType.START)
                        .details(Map.of("description", "Auction started"))
                        .build());

            } catch (Exception e) {
                log.error("Failed to start auction {}", auction.getId(), e);
            }
        }
    }

    /**
     * Chạy mỗi 1 giây, tìm auctions cần end
     */
    @Scheduled(fixedDelay = 1000)
    @Transactional
    @CacheEvict(value = CacheNameConstant.AUCTIONS, allEntries = true)
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
                auction = auctionRepository.save(auction);

                // Update Redis status
                redisAuctionService.updateStatus(auction.getId(), "ENDED");

                log.info("Auction {} ended", auction.getId());

                // Ghi audit
                auctionAuditRepository.save(AuctionAudit.builder()
                        .auction(auction)
                        .actionType(AuctionActionType.END)
                        .details(Map.of("description", "Auction ended"))
                        .build());

                Map<String, Object> details = new HashMap<>();
                details.put("title", auction.getTitle());
                details.put("highest price", auction.getCurrentPrice());
                details.put("seller", auction.getSeller().getEmail());

                if (auction.getHighestBidder() != null) {
                    details.put("winner", auction.getHighestBidder().getEmail());
                } else {
                    details.put("winner", "NO BIDDER");
                }

                auctionAuditRepository.save(AuctionAudit.builder()
                        .auction(auction)
                        .actionType(AuctionActionType.RESULT)
                        .details(details)
                        .build());

            } catch (Exception e) {
                log.error("Failed to end auction {}", auction.getId(), e);
            }
        }
    }
}
