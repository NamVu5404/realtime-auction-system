package com.namvu.realtimeauctionsystem.modules.deposit.service;

import com.namvu.realtimeauctionsystem.modules.deposit.dto.DepositStatusResponse;

import java.math.BigDecimal;
import java.util.List;

public interface DepositService {

    /** Đặt cọc cho một phiên đấu giá. Ném exception nếu không hợp lệ. */
    DepositStatusResponse placeDeposit(Long auctionId, Long userId);

    /** Kiểm tra user đã đặt cọc chưa (từ Redis, O(1)). */
    boolean hasDeposit(Long auctionId, Long userId);

    /** Hoàn cọc cho một user cụ thể (người thua). */
    void releaseDeposit(Long auctionId, Long userId);

    /** Hoàn cọc cho tất cả người đặt cọc (hủy / no-sale). */
    void releaseAllDeposits(Long auctionId);

    /**
     * Áp dụng cọc của winner: trừ từ locked balance, RELEASED cho tất cả người còn lại.
     * Được gọi khi auction kết thúc có winner.
     */
    void applyWinnerDeposit(Long auctionId, Long winnerId);

    /** Phạt winner không thanh toán: 50% → seller, 50% → platform log. */
    void forfeitDeposit(Long auctionId, Long winnerId);

    /** Tính số tiền cọc = startPrice * depositRate. */
    BigDecimal computeDepositAmount(Long auctionId);

    /** Sync danh sách depositors từ DB vào Redis Set (gọi khi SCHEDULED → LIVE). */
    void syncDepositorsToRedis(Long auctionId);

    /** Lấy trạng thái cọc của user trong một phiên. */
    DepositStatusResponse getDepositStatus(Long auctionId, Long userId);

    /** Lấy danh sách tất cả phiên đã cọc của user. */
    List<DepositStatusResponse> getMyDeposits(Long userId);
}
