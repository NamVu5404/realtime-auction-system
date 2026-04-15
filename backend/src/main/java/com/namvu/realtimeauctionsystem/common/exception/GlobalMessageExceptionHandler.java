package com.namvu.realtimeauctionsystem.common.exception;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.support.MethodArgumentNotValidException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.security.Principal;
import java.util.Objects;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.ERRORS_TOPIC_PREFIX;

@ControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalMessageExceptionHandler {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageExceptionHandler(AppException.class)
    public void handleAppException(AppException e, Principal principal) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn(">>> [WebSocket Business Error] for user {}: Code: {}, Message: {}",
                principal.getName(), errorCode.getCode(), errorCode.getMessage());

        sendError(principal.getName(), errorCode);
    }

    @MessageExceptionHandler(MethodArgumentNotValidException.class)
    public void handleValidationException(MethodArgumentNotValidException e, Principal principal) {
        ErrorCode errorCode = ErrorCode.FIELD_INVALID;
        String errorMsg = Objects.requireNonNull(e.getBindingResult()).getFieldErrors().getFirst().getDefaultMessage();
        log.warn(">>> [WebSocket Validation Failed] for user {}: Code: {}, Message: {}",
                principal.getName(), errorCode.getCode(), errorMsg);

        sendError(principal.getName(), errorCode, errorMsg);
    }

    @MessageExceptionHandler(Exception.class)
    public void handleException(Exception e, Principal principal) {
        log.error(">>> [WebSocket System Error] for user {}: ", principal.getName(), e);
        sendError(principal.getName(), ErrorCode.INTERNAL_ERROR);
    }

    private void sendError(String username, ErrorCode errorCode) {
        sendError(username, errorCode, errorCode.getMessage());
    }

    private void sendError(String username, ErrorCode errorCode, String customMessage) {
        messagingTemplate.convertAndSendToUser(
                username,
                ERRORS_TOPIC_PREFIX,
                ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(customMessage)
                        .build()
        );
    }
}
