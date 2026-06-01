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
    REDIS_DOWN(9998, "Redis service is unavailable", HttpStatus.SERVICE_UNAVAILABLE),

    // Common Validation (40xx)
    FIELD_INVALID(4001, "One or more fields are invalid", HttpStatus.BAD_REQUEST),
    INVALID_INPUT(4002, "Invalid input", HttpStatus.BAD_REQUEST),
    INVALID_KEY(4003, "Invalid key", HttpStatus.BAD_REQUEST),

    // Auth (41xx)
    UNAUTHENTICATED(4100, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(4101, "Access denied", HttpStatus.FORBIDDEN),
    UNAUTHORIZED_ACTION(4102, "You are not authorized to perform this action", HttpStatus.FORBIDDEN),
    TOKEN_INVALID(4103, "Token is invalid or expired", HttpStatus.UNAUTHORIZED),
    TOKEN_GENERATION_FAILED(4104, "Failed to generate token", HttpStatus.INTERNAL_SERVER_ERROR),

    // User (42xx)
    USER_EXISTED(4200, "User already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(4201, "User not found", HttpStatus.NOT_FOUND),
    USER_BLOCKED(4202, "User has been blocked", HttpStatus.FORBIDDEN),
    USER_ACTIVE(4203, "User is already active", HttpStatus.BAD_REQUEST),
    USER_ALREADY_SELLER(4204, "User is already a seller", HttpStatus.BAD_REQUEST),

    // Auction (43xx)
    AUCTION_NOT_FOUND(4300, "Auction not found or not activated", HttpStatus.NOT_FOUND),
    AUCTION_CLOSED(4301, "Auction has ended", HttpStatus.GONE),
    AUCTION_BUSY(4302, "Auction is busy, please try again", HttpStatus.CONFLICT),
    AUCTION_VERSION_CONFLICT(4303, "Auction version conflict", HttpStatus.INTERNAL_SERVER_ERROR),
    AUCTION_STATUS_INVALID(4304, "Invalid auction status", HttpStatus.BAD_REQUEST),
    AUCTION_CONFIG_MISSING(4305, "Auction configuration is missing", HttpStatus.INTERNAL_SERVER_ERROR),
    START_END_TIME_INVALID(4306, "End time must be after start time", HttpStatus.BAD_REQUEST),
    RESERVE_PRICE_INVALID(4307, "Reserve price must be greater than or equal to start price", HttpStatus.BAD_REQUEST),

    // Bid (44xx)
    BID_REJECTED(4400, "Bid must be greater than or equal to current price plus minimum step", HttpStatus.BAD_REQUEST),
    MAX_RETRIES_EXCEEDED(4401, "Max retries exceeded", HttpStatus.INTERNAL_SERVER_ERROR),
    INTERRUPTED_DURING_RETRY(4402, "Interrupted during retry", HttpStatus.INTERNAL_SERVER_ERROR),

    // File (45xx)
    FILE_EMPTY(4500, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(4501, "File is too large", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(4502, "Invalid file type", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_ERROR(4503, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DELETE_ERROR(4504, "Failed to delete file", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND(4505, "File not found", HttpStatus.NOT_FOUND),

    // Seller Registration (46xx)
    SELLER_REGISTRATION_NOT_FOUND(4600, "Seller registration not found", HttpStatus.NOT_FOUND),
    SELLER_REGISTRATION_PENDING(4601, "Seller registration is pending", HttpStatus.BAD_REQUEST),
    IDENTITY_VERIFICATION_INCOMPLETE(4602, "Please complete identity verification before proceeding", HttpStatus.BAD_REQUEST),

    // Notification (47xx)
    NOTIFICATION_NOT_FOUND(4700, "Notification not found", HttpStatus.NOT_FOUND),

    // Contact (48xx)
    CONTACT_NOT_FOUND(4800, "Contact inquiry not found", HttpStatus.NOT_FOUND),

    // Live Chat (49xx)
    BANNED_CHAT(4900, "You are banned from chatting", HttpStatus.FORBIDDEN),
    MESSAGE_NOT_FOUND(4901, "Message not found", HttpStatus.NOT_FOUND),
    RATE_LIMIT_EXCEEDED(4902, "Too many requests, please try again later", HttpStatus.TOO_MANY_REQUESTS),
    USER_BANNED(4903, "User has been banned.", HttpStatus.BAD_REQUEST),

    // Kyc (50xx)
    CCCD_ALREADY_EXISTS(5000, "Cccd already exists", HttpStatus.CONFLICT),
    FPT_API_ERROR_1(5001, "Invalid Parameters or Values!", HttpStatus.BAD_REQUEST),
    FPT_API_ERROR_2(5002, "Failed in cropping", HttpStatus.UNPROCESSABLE_ENTITY),
    FPT_API_ERROR_3(5003, "Unable to find ID card in the image", HttpStatus.UNPROCESSABLE_ENTITY),
    FPT_API_ERROR_5(5005, "No URL in the request", HttpStatus.BAD_REQUEST),
    FPT_API_ERROR_6(5006, "Failed to open the URL!", HttpStatus.BAD_GATEWAY),
    FPT_API_ERROR_7(5007, "Invalid image file", HttpStatus.UNPROCESSABLE_ENTITY),
    FPT_API_ERROR_8(5008, "Bad data", HttpStatus.UNPROCESSABLE_ENTITY),
    FPT_API_ERROR_9(5009, "No string base64 in the request", HttpStatus.BAD_REQUEST),
    FPT_API_ERROR_10(5010, "String base64 is not valid", HttpStatus.BAD_REQUEST),
    FPT_NO_DATA(5011, "No data returned from FPT API", HttpStatus.UNPROCESSABLE_ENTITY),
    FPT_RESPONSE_CODE_407(5012, "Face not recognized", HttpStatus.BAD_REQUEST),
    FPT_RESPONSE_CODE_408(5013, "Invalid input image format", HttpStatus.BAD_REQUEST),
    FPT_RESPONSE_CODE_409(5014, "Please upload correct number of image for face check", HttpStatus.BAD_REQUEST),
    KYC_NOT_FOUND(5015, "KYC not found", HttpStatus.NOT_FOUND),
    FACE_MATCH_FAILED(5016, "Face verification failed. Faces do not match", HttpStatus.BAD_REQUEST),
    INVALID_SELFIE_PHOTO(5017, "Live selfie required. Please do not use an ID photo", HttpStatus.BAD_REQUEST),
    FACE_MATCH_ALREADY_VERIFIED(5018, "Face match already verified", HttpStatus.CONFLICT),

    // Wishlist (51xx)
    WISHLIST_NOT_FOUND(5100, "Wishlist item not found", HttpStatus.NOT_FOUND),
    WISHLIST_ALREADY_EXISTS(5101, "Auction is already in your wishlist", HttpStatus.CONFLICT),

    // Hero Slide (52xx)
    HERO_SLIDE_NOT_FOUND(5200, "Hero slide not found", HttpStatus.NOT_FOUND),
    HERO_SLIDE_ALREADY_EXISTS(5201, "Auction is already in hero slides", HttpStatus.CONFLICT),

    // Wallet (53xx)
    WALLET_NOT_FOUND(5300, "Wallet not found", HttpStatus.NOT_FOUND),
    INSUFFICIENT_BALANCE(5301, "Insufficient wallet balance", HttpStatus.BAD_REQUEST),

    // Deposit (54xx)
    DEPOSIT_REQUIRED(5400, "You must place a deposit before bidding on this auction", HttpStatus.FORBIDDEN),
    DEPOSIT_ALREADY_EXISTS(5401, "You have already placed a deposit for this auction", HttpStatus.CONFLICT),
    DEPOSIT_NOT_ALLOWED(5402, "Deposit is not allowed for this auction at this time", HttpStatus.BAD_REQUEST),
    DEPOSIT_CUTOFF_REACHED(5403, "Deposit window has closed - auction ends soon", HttpStatus.BAD_REQUEST),
    DEPOSIT_NOT_FOUND(5404, "Deposit record not found", HttpStatus.NOT_FOUND),
    DEPOSIT_RATE_REQUIRED(5405, "Deposit rate is required when deposit is enabled", HttpStatus.BAD_REQUEST),
    ;

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
