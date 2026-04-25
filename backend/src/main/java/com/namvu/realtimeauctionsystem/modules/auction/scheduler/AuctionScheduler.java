package com.namvu.realtimeauctionsystem.modules.auction.scheduler;

import com.namvu.realtimeauctionsystem.common.constant.AuctionActionType;
import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.service.BidService;
import com.namvu.realtimeauctionsystem.modules.mail.service.MailService;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.wishlist.service.WishListService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class AuctionScheduler {

    private final AuctionRepository auctionRepository;
    private final RedisAuctionService redisAuctionService;
    private final AuctionAuditRepository auctionAuditRepository;
    private final BidService bidService;
    private final NotificationService notificationService;
    private final MailService mailService;
    private final WishListService wishListService;

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

                // Notify wishlist users
                notifyWishlistUsersOnStart(auction);

            } catch (Exception e) {
                log.error("Failed to start auction {}", auction.getId(), e);
            }
        }
    }

    private void notifyWishlistUsersOnStart(Auction auction) {
        Set<Long> wishlistUserIds = wishListService.getUserIdsByAuctionId(auction.getId());
        if (wishlistUserIds.isEmpty()) return;

        notificationService.processWishlistAuctionStartNotifications(
                auction.getId(), auction.getTitle(), auction.getStartPrice(), wishlistUserIds
        );
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
                if (auction.getReservePrice() != null && auction.getCurrentPrice().compareTo(auction.getReservePrice()) < 0) {
                    redisAuctionService.deleteAuction(auction.getId());

                    auction.setStatus(AuctionStatus.ENDED_NO_SALE);
                    auctionRepository.save(auction);

                    // Ghi audit
                    auctionAuditRepository.save(AuctionAudit.builder()
                            .auction(auction)
                            .actionType(AuctionActionType.ENDED_NO_SALE)
                            .details(Map.of("Description", "Auction ended no sale"))
                            .build());

                    // AUCTION_ENDED_NO_SALE_BIDDER
                    Set<Long> bidderIds = bidService.getParticipantIds(auction.getId());
                    notificationService.processEndedNoSaleBidderNotifications(auction.getId(), auction.getTitle(), bidderIds);

                    // AUCTION_ENDED_NO_SALE_SELLER
                    notificationService.processEndedNoSaleSellerNotifications(auction.getId(), auction.getTitle(), auction.getSeller().getId());

                    continue;
                }

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

                if (auction.getHighestBidder() != null) {
                    details.put("winner", auction.getHighestBidder().getEmail());
                    details.put("highest price", auction.getCurrentPrice());

                    // Send email Winner
                    mailService.sendAuctionWinnerEmail(
                            auction.getHighestBidder().getEmail(),
                            auction.getHighestBidder().getName(),
                            auction.getTitle(),
                            auction.getCurrentPrice(),
                            auction.getId(),
                            auction.getToken()
                    );

                    // AUCTION_ENDED_WINNER
                    notificationService.processWinnerAuctionNotifications(
                            auction.getId(),
                            auction.getHighestBidder().getId(),
                            auction.getTitle(),
                            auction.getCurrentPrice()
                    );

                    // AUCTION_ENDED_SELLER
                    notificationService.processAuctionEndSellerNotifications(
                            auction.getId(),
                            auction.getSeller().getId(),
                            auction.getTitle(),
                            auction.getCurrentPrice(),
                            auction.getHighestBidder().getName()
                    );

                    // AUCTION_ENDED_LOSER
                    Set<Long> bidderIds = bidService.getParticipantIds(auction.getId());
                    bidderIds.remove(auction.getHighestBidder().getId()); // Xóa winner

                    notificationService.processLoserBidderNotifications(
                            auction.getId(),
                            auction.getTitle(),
                            bidderIds
                    );

                } else {
                    details.put("winner", "NO BIDDER");

                    // AUCTION_ENDED_NO_BIDS
                    notificationService.processNoBidderNotifications(
                            auction.getId(),
                            auction.getSeller().getId(),
                            auction.getTitle()
                    );
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

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void notifyAuctionsEndingSoon() {
        Instant now = Instant.now();
        Instant fiveMinutesFromNow = now.plus(5, ChronoUnit.MINUTES);

        List<Auction> auctions = auctionRepository.findByNotifiedEndingSoonFalse(now, fiveMinutesFromNow);

        if (auctions.isEmpty()) return;

        log.info("Processing {} ending soon auctions.", auctions.size());

        for (Auction auction : auctions) {
            // Đánh dấu đã gửi thông báo
            auction.setNotifiedEndingSoon(true);

            Set<Long> bidderIds = bidService.getParticipantIds(auction.getId());
            if (bidderIds.isEmpty()) continue;

            notificationService.processAuctionEndingSoonNotifications(
                    auction.getId(),
                    auction.getTitle(),
                    auction.getCurrentPrice(),
                    bidderIds
            );
        }
    }
}
