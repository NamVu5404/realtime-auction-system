package com.namvu.realtimeauctionsystem.modules.deposit.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.constant.DepositStatus;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.deposit.dto.DepositStatusResponse;
import com.namvu.realtimeauctionsystem.modules.deposit.entity.AuctionDeposit;
import com.namvu.realtimeauctionsystem.modules.deposit.repository.AuctionDepositRepository;
import com.namvu.realtimeauctionsystem.modules.deposit.service.DepositService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.namvu.realtimeauctionsystem.modules.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepositServiceImpl implements DepositService {

    private static final String DEPOSITORS_KEY_PREFIX = "auction:%d:depositors";

    private final AuctionDepositRepository depositRepository;
    private final AuctionService auctionService;
    private final UserService userService;
    private final WalletService walletService;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    public DepositStatusResponse placeDeposit(Long auctionId, Long userId) {
        Auction auction = auctionService.getAuctionDetailById(auctionId);

        validateDepositAllowed(auction, userId);

        BigDecimal amount = computeDepositAmount(auctionId);
        walletService.lockFunds(userId, amount);

        User userRef = userService.getUserReference(userId);
        Auction auctionRef = auctionService.getAuctionReference(auctionId);

        AuctionDeposit deposit = AuctionDeposit.builder()
                .user(userRef)
                .auction(auctionRef)
                .depositAmount(amount)
                .status(DepositStatus.LOCKED)
                .build();
        depositRepository.save(deposit);

        addToRedisDepositors(auctionId, userId, auction.getEndTime());

        return toStatusResponse(deposit, true);
    }

    @Override
    public boolean hasDeposit(Long auctionId, Long userId) {
        Boolean member = redisTemplate.opsForSet()
                .isMember(depositorsKey(auctionId), userId.toString());
        if (Boolean.TRUE.equals(member)) return true;
        // Fallback to DB if Redis miss
        return depositRepository.existsByAuctionIdAndUserId(auctionId, userId);
    }

    @Override
    @Transactional
    public void releaseDeposit(Long auctionId, Long userId) {
        AuctionDeposit deposit = depositRepository.findByAuctionIdAndUserId(auctionId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPOSIT_NOT_FOUND));
        if (deposit.getStatus() != DepositStatus.LOCKED) return;

        walletService.releaseFunds(userId, deposit.getDepositAmount());
        deposit.setStatus(DepositStatus.RELEASED);
        deposit.setReleasedAt(Instant.now());
        depositRepository.save(deposit);
    }

    @Override
    @Transactional
    public void releaseAllDeposits(Long auctionId) {
        List<AuctionDeposit> locked = depositRepository.findByAuctionIdAndStatus(auctionId, DepositStatus.LOCKED);
        for (AuctionDeposit d : locked) {
            try {
                walletService.releaseFunds(d.getUser().getId(), d.getDepositAmount());
                d.setStatus(DepositStatus.RELEASED);
                d.setReleasedAt(Instant.now());
            } catch (Exception e) {
                log.error("Failed to release deposit id={} for user={}", d.getId(), d.getUser().getId(), e);
            }
        }
        depositRepository.saveAll(locked);
    }

    @Override
    @Transactional
    public void applyWinnerDeposit(Long auctionId, Long winnerId) {
        // Winner: trừ tiền cọc khỏi locked balance (cọc được tính vào giá cuối)
        AuctionDeposit winnerDeposit = depositRepository.findByAuctionIdAndUserId(auctionId, winnerId)
                .orElse(null);
        if (winnerDeposit != null && winnerDeposit.getStatus() == DepositStatus.LOCKED) {
            walletService.deductLockedFunds(winnerId, winnerDeposit.getDepositAmount());
            winnerDeposit.setStatus(DepositStatus.RELEASED);
            winnerDeposit.setReleasedAt(Instant.now());
            depositRepository.save(winnerDeposit);
        }

        // Người thua: hoàn cọc
        List<AuctionDeposit> losers = depositRepository
                .findByAuctionIdAndStatusAndUserIdNot(auctionId, DepositStatus.LOCKED, winnerId);
        for (AuctionDeposit d : losers) {
            try {
                walletService.releaseFunds(d.getUser().getId(), d.getDepositAmount());
                d.setStatus(DepositStatus.RELEASED);
                d.setReleasedAt(Instant.now());
            } catch (Exception e) {
                log.error("Failed to release deposit for loser user={} auction={}", d.getUser().getId(), auctionId, e);
            }
        }
        depositRepository.saveAll(losers);
    }

    @Override
    @Transactional
    public void forfeitDeposit(Long auctionId, Long winnerId) {
        AuctionDeposit deposit = depositRepository.findByAuctionIdAndUserId(auctionId, winnerId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPOSIT_NOT_FOUND));
        if (deposit.getStatus() != DepositStatus.LOCKED) {
            throw new AppException(ErrorCode.DEPOSIT_NOT_ALLOWED);
        }

        Auction auction = auctionService.getAuctionDetailById(auctionId);
        BigDecimal amount = deposit.getDepositAmount();
        BigDecimal half = amount.divide(BigDecimal.valueOf(2));

        // 50% về seller wallet
        walletService.deductLockedFunds(winnerId, amount);
        walletService.creditFunds(auction.getSeller().getId(), half);
        // 50% platform — ghi log; tích hợp payment gateway sau

        deposit.setStatus(DepositStatus.FORFEITED);
        deposit.setReleasedAt(Instant.now());
        depositRepository.save(deposit);

        log.info("Deposit forfeited: auctionId={}, winnerId={}, amount={}, sellerShare={}, platformShare={}",
                auctionId, winnerId, amount, half, half);
    }

    @Override
    public BigDecimal computeDepositAmount(Long auctionId) {
        Auction auction = auctionService.getAuctionDetailById(auctionId);
        if (!auction.isDepositRequired() || auction.getDepositRate() == null) {
            return BigDecimal.ZERO;
        }
        return auction.getStartPrice().multiply(auction.getDepositRate());
    }

    @Override
    @Transactional
    public void syncDepositorsToRedis(Long auctionId) {
        Auction auction = auctionService.getAuctionDetailById(auctionId);
        List<AuctionDeposit> locked = depositRepository.findByAuctionIdAndStatus(auctionId, DepositStatus.LOCKED);
        if (locked.isEmpty()) return;

        String key = depositorsKey(auctionId);
        String[] members = locked.stream()
                .map(d -> d.getUser().getId().toString())
                .toArray(String[]::new);
        redisTemplate.opsForSet().add(key, members);

        long ttl = Duration.between(Instant.now(), auction.getEndTime()).getSeconds();
        if (ttl > 0) {
            redisTemplate.expire(key, ttl, TimeUnit.SECONDS);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DepositStatusResponse getDepositStatus(Long auctionId, Long userId) {
        return depositRepository.findByAuctionIdAndUserId(auctionId, userId)
                .map(d -> toStatusResponse(d, true))
                .orElse(DepositStatusResponse.builder()
                        .hasDeposit(false)
                        .auctionId(auctionId)
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepositStatusResponse> getMyDeposits(Long userId) {
        return depositRepository.findByUserId(userId).stream()
                .map(d -> toStatusResponse(d, true))
                .collect(Collectors.toList());
    }

    // --- Private helpers ---

    private void validateDepositAllowed(Auction auction, Long userId) {
        if (!auction.isDepositRequired()) {
            throw new AppException(ErrorCode.DEPOSIT_NOT_ALLOWED);
        }
        AuctionStatus status = auction.getStatus();
        if (status != AuctionStatus.SCHEDULED && status != AuctionStatus.LIVE) {
            throw new AppException(ErrorCode.DEPOSIT_NOT_ALLOWED);
        }
        if (status == AuctionStatus.LIVE) {
            long remainingMinutes = Duration.between(Instant.now(), auction.getEndTime()).toMinutes();
            int cutoff = auction.getDepositCutoffMinutes() != null ? auction.getDepositCutoffMinutes() : 5;
            if (remainingMinutes < cutoff) {
                throw new AppException(ErrorCode.DEPOSIT_CUTOFF_REACHED);
            }
        }
        if (auction.getSeller().getId().equals(userId)) {
            throw new AppException(ErrorCode.DEPOSIT_NOT_ALLOWED);
        }
        if (depositRepository.existsByAuctionIdAndUserId(auction.getId(), userId)) {
            throw new AppException(ErrorCode.DEPOSIT_ALREADY_EXISTS);
        }
    }

    private void addToRedisDepositors(Long auctionId, Long userId, Instant endTime) {
        String key = depositorsKey(auctionId);
        redisTemplate.opsForSet().add(key, userId.toString());
        long ttl = Duration.between(Instant.now(), endTime).getSeconds();
        if (ttl > 0) {
            redisTemplate.expire(key, ttl, TimeUnit.SECONDS);
        }
    }

    private String depositorsKey(Long auctionId) {
        return String.format(DEPOSITORS_KEY_PREFIX, auctionId);
    }

    private DepositStatusResponse toStatusResponse(AuctionDeposit deposit, boolean hasDeposit) {
        return DepositStatusResponse.builder()
                .hasDeposit(hasDeposit)
                .auctionId(deposit.getAuction().getId())
                .depositAmount(deposit.getDepositAmount())
                .status(deposit.getStatus())
                .createdAt(deposit.getCreatedAt())
                .releasedAt(deposit.getReleasedAt())
                .build();
    }
}
