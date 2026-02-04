package com.NamVu.realtimeauctionsystem.enums;

public enum OutboxStatus {
    PENDING,    // Chưa gửi
    SENT,       // Đã gửi Kafka thành công
    FAILED      // Thất bại sau MAX_RETRY lần
}
