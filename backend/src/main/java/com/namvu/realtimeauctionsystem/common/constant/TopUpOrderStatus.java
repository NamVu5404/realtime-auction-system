package com.namvu.realtimeauctionsystem.common.constant;

public enum TopUpOrderStatus {
    PENDING,    // Đơn đã tạo, chờ user thanh toán
    COMPLETED,  // SePay webhook xác nhận thành công → ví đã được credit
    FAILED,     // Thanh toán thất bại / webhook lỗi
    CANCELLED   // User huỷ trên trang SePay
}
