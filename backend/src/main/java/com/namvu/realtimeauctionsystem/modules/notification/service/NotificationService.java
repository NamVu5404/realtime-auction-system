package com.namvu.realtimeauctionsystem.modules.notification.service;

import com.namvu.realtimeauctionsystem.common.constant.NotificationConstant;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidEvent;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public interface NotificationService {
    void createAndPushNotification(Long recipientId, NotificationConstant type, String content, String redirectUrl);

    List<NotificationResponse> getNotificationsForBell(Long userId);

    PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable);

    Integer getUnreadCountNotifications(Long userId);

    void markNotificationAsRead(Long notificationId);

    Integer markAllNotificationsAsReadForUser(Long userId);

    void deleteNotification(Long id);

    void deleteAllNotificationsForUser(Long userId);

    void processBidNotifications(BidEvent event, String title, BigDecimal currentPrice);

    void processAuctionEndingSoonNotifications(Long auctionId, String title, BigDecimal currentPrice, Set<Long> bidderIds);

    void processWinnerAuctionNotifications(Long auctionId, Long userId, String title, BigDecimal currentPrice);

    void processNoBidderNotifications(Long auctionId, Long userId, String title);

    void processAuctionEndSellerNotifications(Long auctionId, Long sellerId, String title, BigDecimal currentPrice, String highestBidderName);

    void processLoserBidderNotifications(Long auctionId, String title, Set<Long> bidderIds);

    void processApproveSellerNotifications(Long userId);
    
    void processManualUpgradeToSellerNotifications(Long userId);

    void processRejectSellerNotifications(Long userId, String reason);

    void processRevokeSellerNotifications(Long userId, String reason);

    void processApplySellerNotifications(Set<Long> adminIds);

    void processEndedNoSaleBidderNotifications(Long auctionId, String title, Set<Long> bidderIds);

    void processEndedNoSaleSellerNotifications(Long auctionId, String title, Long sellerId);

    void processWishlistAuctionStartNotifications(Long auctionId, String title, BigDecimal startPrice, Set<Long> userIds);

    void processWishlistAuctionCancelledNotifications(Long auctionId, String title, Set<Long> userIds);

    void processAuctionPendingReviewNotifications(Long sellerId, Long auctionId, String title);

    void processAuctionApprovedNotifications(Long sellerId, Long auctionId, String title);

    void processAuctionRejectedNotifications(Long sellerId, Long auctionId, String title, String reason);

    void processAdminAuctionReviewNotifications(Set<Long> adminIds, Long auctionId, String title);
}
