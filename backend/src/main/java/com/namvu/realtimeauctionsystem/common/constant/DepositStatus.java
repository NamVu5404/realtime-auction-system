package com.namvu.realtimeauctionsystem.common.constant;

public enum DepositStatus {
    LOCKED,    // Tiền đã khóa, chờ kết quả đấu giá
    RELEASED,  // Đã hoàn cọc (người thua hoặc hủy/no-sale)
    APPLIED,   // Cọc đã khấu trừ vào giá thanh toán cuối (winner)
    FORFEITED  // Bị phạt (winner không thanh toán): 50% → seller, 50% → platform
}
