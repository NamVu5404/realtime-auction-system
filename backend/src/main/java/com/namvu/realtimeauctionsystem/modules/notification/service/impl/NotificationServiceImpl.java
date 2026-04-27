package com.namvu.realtimeauctionsystem.modules.notification.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.common.constant.NotificationConstant;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.MoneyUtils;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidEvent;
import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import com.namvu.realtimeauctionsystem.modules.notification.entity.Notification;
import com.namvu.realtimeauctionsystem.modules.notification.mapper.NotificationMapper;
import com.namvu.realtimeauctionsystem.modules.notification.repository.NotificationRepository;
import com.namvu.realtimeauctionsystem.modules.notification.service.NotificationService;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.Executor.NOTIFICATION_EXECUTOR;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.NOTIFICATION_TOPIC_PREFIX;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationContext applicationContext;

    private NotificationService self() {
        return applicationContext.getBean(NotificationService.class);
    }

    @Override
    @CacheEvict(value = {CacheNameConstant.NOTIFICATION_COUNT, CacheNameConstant.NOTIFICATION_BELL}, key = "#recipientId")
    public void createAndPushNotification(Long recipientId, NotificationConstant type, String content, String redirectUrl) {
        Notification notification = Notification.builder()
                .recipient(userService.getUserReference(recipientId))
                .type(type)
                .content(content)
                .redirectUrl(redirectUrl)
                .build();

        notification = notificationRepository.save(notification);

        pushNotification(notification);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNameConstant.NOTIFICATION_BELL, key = "#userId")
    public List<NotificationResponse> getNotificationsForBell(Long userId) {
        List<Notification> notifications = notificationRepository.findTop5ByRecipientIdAndReadOrderByCreatedAtDesc(userId, false);
        return new ArrayList<>(notifications.stream().map(notificationMapper::mapToResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotificationsForUser(Long userId, Pageable pageable) {
        Page<Notification> notificationPage = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.<NotificationResponse>builder()
                .totalPage(notificationPage.getTotalPages())
                .pageSize(notificationPage.getSize())
                .currentPage(notificationPage.getNumber() + 1)
                .totalElements(notificationPage.getTotalElements())
                .data(notificationPage.map(notificationMapper::mapToResponse).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNameConstant.NOTIFICATION_COUNT, key = "#userId")
    public Integer getUnreadCountNotifications(Long userId) {
        return notificationRepository.countByRecipientIdAndRead(userId, false);
    }

    @Override
    @CacheEvict(value = {CacheNameConstant.NOTIFICATION_COUNT, CacheNameConstant.NOTIFICATION_BELL}, key = "T(com.namvu.realtimeauctionsystem.common.utils.SecurityUtils).getCurrentUserId()")
    public void markNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Objects.equals(notification.getRecipient().getId(), SecurityUtils.getCurrentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    @CacheEvict(value = {CacheNameConstant.NOTIFICATION_COUNT, CacheNameConstant.NOTIFICATION_BELL}, key = "#userId")
    public Integer markAllNotificationsAsReadForUser(Long userId) {
        return notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    @CacheEvict(value = {CacheNameConstant.NOTIFICATION_COUNT, CacheNameConstant.NOTIFICATION_BELL}, key = "T(com.namvu.realtimeauctionsystem.common.utils.SecurityUtils).getCurrentUserId()")
    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (!Objects.equals(notification.getRecipient().getId(), SecurityUtils.getCurrentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        notificationRepository.delete(notification);
    }

    @Override
    @CacheEvict(value = {CacheNameConstant.NOTIFICATION_COUNT, CacheNameConstant.NOTIFICATION_BELL}, key = "#userId")
    public void deleteAllNotificationsForUser(Long userId) {
        notificationRepository.deleteAllNotificationsForUser(userId);
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processBidNotifications(BidEvent event, String title, BigDecimal currentPrice) {
        try {
            // Xử lý gửi Notification: OUTBID
            // Chỉ gửi khi có người từng dẫn đầu trước đó và không phải tự outbid chính mình
            if (event.getPreviousBidderId() != null && event.getPreviousBidderId() > 0
                    && !event.getPreviousBidderId().equals(event.getBidderId())) {

                NotificationConstant type = NotificationConstant.OUTBID;
                String content = type.buildContent(title, MoneyUtils.format(currentPrice));
                String redirectUrl = type.buildRedirectUrl(event.getAuctionId());

                self().createAndPushNotification(event.getPreviousBidderId(), type, content, redirectUrl);
            }

            // Xử lý gửi Notification: BID_PLACED (Chỉ gửi cho người bán - Seller)
            if (event.getSellerId() != null && event.getSellerId() > 0
                    && !event.getSellerId().equals(event.getBidderId())) {

                NotificationConstant type = NotificationConstant.BID_PLACED;
                String content = type.buildContent(title, MoneyUtils.format(currentPrice));
                String redirectUrl = type.buildRedirectUrl(event.getAuctionId());

                self().createAndPushNotification(event.getSellerId(), type, content, redirectUrl);
            }
        } catch (Exception e) {
            log.error("Failed to process bid notifications for auction {}: {}", event.getAuctionId(), e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processAuctionEndingSoonNotifications(Long auctionId, String title, BigDecimal currentPrice, Set<Long> bidderIds) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDING_SOON;
            String content = type.buildContent(title, MoneyUtils.format(currentPrice));
            String redirectUrl = type.buildRedirectUrl(auctionId);

            bidderIds.forEach(userId ->
                    self().createAndPushNotification(userId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process auction ending soon notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processWinnerAuctionNotifications(Long auctionId, Long userId, String title, BigDecimal currentPrice) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_WINNER;
            String content = type.buildContent(title, MoneyUtils.format(currentPrice));
            String redirectUrl = type.buildRedirectUrl(auctionId);

            self().createAndPushNotification(userId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process winner auction notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processNoBidderNotifications(Long auctionId, Long userId, String title) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_NO_BIDS;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);

            self().createAndPushNotification(userId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process no bidder notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processAuctionEndSellerNotifications(Long auctionId, Long sellerId, String title, BigDecimal currentPrice, String highestBidderName) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_SELLER;
            String content = type.buildContent(title, MoneyUtils.format(currentPrice), highestBidderName);
            String redirectUrl = type.buildRedirectUrl(auctionId);

            self().createAndPushNotification(sellerId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process auction end seller notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processLoserBidderNotifications(Long auctionId, String title, Set<Long> bidderIds) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_LOSER;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);

            bidderIds.forEach(userId ->
                    self().createAndPushNotification(userId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process loser bidder notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    /**
     *  Removed @Async: admin action không cần response nhanh
     *  Dùng @Async trực tiếp trong @Transactional có thể gây race condition (thread async đọc DB trước khi commit)
     */
    @Override
    public void processApproveSellerNotifications(Long userId) {
        try {
            NotificationConstant type = NotificationConstant.SELLER_REGISTRATION_APPROVED;
            self().createAndPushNotification(userId, type, type.getContent(), type.getRedirectUrl());
        } catch (Exception e) {
            log.warn("Failed to process approve seller notifications for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void processManualUpgradeToSellerNotifications(Long userId) {
        try {
            NotificationConstant type = NotificationConstant.MANUAL_UPGRADE_TO_SELLER;
            self().createAndPushNotification(userId, type, type.getContent(), type.getRedirectUrl());
        } catch (Exception e) {
            log.warn("Failed to process manual upgrade to seller notifications for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void processRejectSellerNotifications(Long userId, String reason) {
        try {
            NotificationConstant type = NotificationConstant.SELLER_REGISTRATION_REJECTED;
            String content = type.buildContent(reason);
            self().createAndPushNotification(userId, type, content, type.getRedirectUrl());
        } catch (Exception e) {
            log.warn("Failed to process reject seller notifications for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void processRevokeSellerNotifications(Long userId, String reason) {
        try {
            NotificationConstant type = NotificationConstant.REVOKE_SELLER_ROLE;
            String content = type.buildContent(reason);
            self().createAndPushNotification(userId, type, content, type.getRedirectUrl());
        } catch (Exception e) {
            log.warn("Failed to process revoke seller notifications for user {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public void processApplySellerNotifications(Set<Long> adminIds) {
        try {
            NotificationConstant type = NotificationConstant.REQUEST_APPLY_SELLER;

            adminIds.forEach(adminId ->
                    self().createAndPushNotification(adminId, type, type.getContent(), type.getRedirectUrl())
            );
        } catch (Exception e) {
            log.warn("Failed to process apply seller notifications for admins {}: {}", adminIds, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processEndedNoSaleBidderNotifications(Long auctionId, String title, Set<Long> bidderIds) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_NO_SALE_BIDDER;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);

            bidderIds.forEach(userId ->
                    self().createAndPushNotification(userId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process ended no sale bidder notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processEndedNoSaleSellerNotifications(Long auctionId, String title, Long sellerId) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_ENDED_NO_SALE_SELLER;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);
            self().createAndPushNotification(sellerId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process ended no sale seller notifications for user {}: {}", sellerId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processWishlistAuctionStartNotifications(Long auctionId, String title, BigDecimal startPrice, Set<Long> userIds) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_START;
            String content = type.buildContent(title, MoneyUtils.format(startPrice));
            String redirectUrl = type.buildRedirectUrl(auctionId);

            userIds.forEach(userId ->
                    self().createAndPushNotification(userId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process wishlist auction start notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processWishlistAuctionCancelledNotifications(Long auctionId, String title, Set<Long> userIds) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_CANCELLED;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);

            userIds.forEach(userId ->
                    self().createAndPushNotification(userId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process wishlist auction cancelled notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    @Async(NOTIFICATION_EXECUTOR)
    public void processAuctionPendingReviewNotifications(Long sellerId, Long auctionId, String title) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_PENDING_REVIEW;
            String content = type.buildContent(title);
            String redirectUrl = type.buildRedirectUrl(auctionId);
            self().createAndPushNotification(sellerId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process auction pending review notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    public void processAuctionApprovedNotifications(Long sellerId, Long auctionId, String title, Instant startTime) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_APPROVED;
            String formattedTime = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
                    .withZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .format(startTime);
            String content = type.buildContent(title, formattedTime);
            String redirectUrl = type.buildRedirectUrl(auctionId);
            self().createAndPushNotification(sellerId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process auction approved notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    public void processAuctionRejectedNotifications(Long sellerId, Long auctionId, String title, String reason) {
        try {
            NotificationConstant type = NotificationConstant.AUCTION_REJECTED;
            String content = type.buildContent(title, reason != null ? reason : "Không có lý do cụ thể");
            String redirectUrl = type.buildRedirectUrl(auctionId);
            self().createAndPushNotification(sellerId, type, content, redirectUrl);
        } catch (Exception e) {
            log.warn("Failed to process auction rejected notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    @Override
    public void processAdminAuctionReviewNotifications(Set<Long> adminIds, Long auctionId, String title) {
        try {
            NotificationConstant type = NotificationConstant.REQUEST_REVIEW_AUCTION;
            String content = type.buildContent(title);
            String redirectUrl = type.getRedirectUrl();
            adminIds.forEach(adminId ->
                    self().createAndPushNotification(adminId, type, content, redirectUrl)
            );
        } catch (Exception e) {
            log.warn("Failed to process admin auction review notifications for auction {}: {}", auctionId, e.getMessage());
        }
    }

    private void pushNotification(Notification notification) {
        NotificationResponse response = notificationMapper.mapToResponse(notification);

        // Gửi WebSocket đích danh (Private topic)
        messagingTemplate.convertAndSend(
                NOTIFICATION_TOPIC_PREFIX + response.getUserId(),
                response
        );

        log.info("Pushed {} notification to user {}", notification.getType(), response.getUserId());
    }
}
