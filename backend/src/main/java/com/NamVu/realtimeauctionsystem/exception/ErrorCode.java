package com.NamVu.realtimeauctionsystem.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    INTERNAL_ERROR(9999, "Lỗi hệ thống", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid Key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Tài khoản đã tồn tài", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1003, "Tài khoản chưa tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1004, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1005, "Unauthorized", HttpStatus.FORBIDDEN),
    AUCTION_CONFIG_MISSING(1006, "Cấu hình auction bị thiếu", HttpStatus.INTERNAL_SERVER_ERROR),
    BID_REJECTED(1007, "Giá thầu phải lớn hơn hoặc bằng giá cũ cộng min step", HttpStatus.BAD_REQUEST),
    AUCTION_BUSY(1008, "Auction đang có người bid, vui lòng thử lại", HttpStatus.CONFLICT),
    AUCTION_NOT_FOUND(1009, "Auction không tồn tại hoặc chưa được kích hoạt", HttpStatus.NOT_FOUND),
    AUCTION_CLOSED(1010, "Auction đã kết thúc", HttpStatus.GONE),
    AUCTION_VERSION_CONFLICT(1011, "Auction version conflict", HttpStatus.INTERNAL_SERVER_ERROR),
    MAX_RETRIES_EXCEEDED(1012, "Max retries exceeded", HttpStatus.INTERNAL_SERVER_ERROR),
    INTERRUPTED_DURING_RETRY(1013, "Interrupted during retry", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_BLOCKED(1014, "Tài khoản đã bị cấm", HttpStatus.BAD_REQUEST),
    TOKEN_INVALID(1015, "Token invalid", HttpStatus.UNAUTHORIZED),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
