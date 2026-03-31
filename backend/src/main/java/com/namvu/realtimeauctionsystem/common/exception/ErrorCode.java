package com.namvu.realtimeauctionsystem.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // System (9xxx)
    INTERNAL_ERROR(9999, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),

    // Common Validation (40xx)
    FIELD_INVALID(4001, "One or more fields are invalid", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(4002, "Invalid input", HttpStatus.BAD_REQUEST),
    INVALID_KEY(4003, "Invalid key", HttpStatus.BAD_REQUEST),

    // Auth (41xx)
    UNAUTHENTICATED(4110, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(4111, "Access denied", HttpStatus.FORBIDDEN),
    UNAUTHORIZED_ACTION(4112, "You are not authorized to perform this action", HttpStatus.FORBIDDEN),
    TOKEN_INVALID(4113, "Token is invalid or expired", HttpStatus.UNAUTHORIZED),
    TOKEN_GENERATION_FAILED(4114, "Failed to generate token", HttpStatus.INTERNAL_SERVER_ERROR),

    // User (42xx)
    USER_EXISTED(4220, "User already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(4221, "User not found", HttpStatus.NOT_FOUND),
    USER_BLOCKED(4222, "User has been blocked", HttpStatus.FORBIDDEN),
    USER_ACTIVE(4223, "User is already active", HttpStatus.BAD_REQUEST),
    USER_ALREADY_SELLER(4224, "User is already a seller", HttpStatus.BAD_REQUEST),

    // Auction (43xx)
    AUCTION_NOT_FOUND(4330, "Auction not found or not activated", HttpStatus.NOT_FOUND),
    AUCTION_CLOSED(4331, "Auction has ended", HttpStatus.GONE),
    AUCTION_BUSY(4332, "Auction is busy, please try again", HttpStatus.CONFLICT),
    AUCTION_VERSION_CONFLICT(4333, "Auction version conflict", HttpStatus.INTERNAL_SERVER_ERROR),
    AUCTION_STATUS_INVALID(4334, "Invalid auction status", HttpStatus.BAD_REQUEST),
    AUCTION_CONFIG_MISSING(4335, "Auction configuration is missing", HttpStatus.INTERNAL_SERVER_ERROR),
    START_END_TIME_INVALID(4336, "Start time or end time is invalid", HttpStatus.BAD_REQUEST),

    // Bid (44xx)
    BID_REJECTED(4440, "Bid must be greater than or equal to current price plus minimum step", HttpStatus.BAD_REQUEST),
    MAX_RETRIES_EXCEEDED(4441, "Max retries exceeded", HttpStatus.INTERNAL_SERVER_ERROR),
    INTERRUPTED_DURING_RETRY(4442, "Interrupted during retry", HttpStatus.INTERNAL_SERVER_ERROR),

    // File (45xx)
    FILE_EMPTY(4550, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(4551, "File is too large", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(4552, "Invalid file type", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_ERROR(4553, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DELETE_ERROR(4554, "Failed to delete file", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND(4555, "File not found", HttpStatus.NOT_FOUND),

    // Seller Registration (46xx)
    SELLER_REGISTRATION_NOT_FOUND(4660, "Seller registration not found", HttpStatus.NOT_FOUND),
    SELLER_REGISTRATION_PENDING(4661, "Seller registration is pending", HttpStatus.BAD_REQUEST),

    // Notification (47xx)
    NOTIFICATION_NOT_FOUND(4770, "Notification not found", HttpStatus.NOT_FOUND),

    // Infrastructure (48xx)
    REDIS_DOWN(4880, "Redis service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
