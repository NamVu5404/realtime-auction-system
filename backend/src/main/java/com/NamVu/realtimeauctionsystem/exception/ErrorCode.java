package com.namvu.realtimeauctionsystem.exception;

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
    USER_ACTIVE(1015, "Tài khoản đang hoạt động", HttpStatus.BAD_REQUEST),
    TOKEN_INVALID(1016, "Token invalid", HttpStatus.UNAUTHORIZED),
    AUCTION_STATUS_INVALID(1017, "Auction status invalid", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(1018, "Input invalid", HttpStatus.BAD_REQUEST),
    START_END_TIME_INVALID(1019, "Start time or end time invalid", HttpStatus.BAD_REQUEST),
    REDIS_DOWN(1020, "Redis is down", HttpStatus.SERVICE_UNAVAILABLE),
    EMAIL_NOT_BLANK(1021, "Email ís not blank", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_BLANK(1022, "Password is not blank", HttpStatus.BAD_REQUEST),
    REASON_NOT_BLANK(1023, "Reason is not blank", HttpStatus.BAD_REQUEST),
    AMOUNT_NOT_BLANK(1024, "Amount is required", HttpStatus.BAD_REQUEST),
    INVALID_AMOUNT(1025, "Amount must be greater than 0", HttpStatus.BAD_REQUEST),
    FILE_EMPTY(1026, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1027, "File is too large", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(1028, "Invalid file type", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_ERROR(1028, "File upload error", HttpStatus.INTERNAL_SERVER_ERROR),
    TOKEN_GENERATION_FAILED(1029, "Token generate failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DELETE_ERROR(1030, "Delete file failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND(1031, "File not found", HttpStatus.NOT_FOUND),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
