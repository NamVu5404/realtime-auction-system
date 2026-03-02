package com.namvu.realtimeauctionsystem.exception;

import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    private static final String MAX_ATTRIBUTE = "max";
    private static final String MIN_ATTRIBUTE = "min";

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ApiResponse<?>> exceptionHandler(Exception e, HttpServletRequest request) {
        log.error(">>> [System Error] Unhandled exception occurred at [{} {}]: ",
                request.getMethod(), request.getRequestURI(), e);

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(ErrorCode.INTERNAL_ERROR.getCode())
                .message(ErrorCode.INTERNAL_ERROR.getMessage())
                .build();

        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse<?>> customExceptionHandler(AppException e, HttpServletRequest request) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn(">>> [Business Error] at [{} {}]: Code: {}, Message: {}",
                request.getMethod(), request.getRequestURI(), errorCode.getCode(), errorCode.getMessage());

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> accessDeniedExceptionHandler(AccessDeniedException e, HttpServletRequest request) {
        log.warn(">>> [Security Error] Access Denied at [{} {}]: {}",
                request.getMethod(), request.getRequestURI(), e.getMessage());

        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(
                        ApiResponse.builder()
                                .code(errorCode.getCode())
                                .message(errorCode.getMessage())
                                .build()
                );
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> methodArgumentNotValidExceptionHandler(MethodArgumentNotValidException e, HttpServletRequest request) {
        FieldError fieldError = e.getFieldError();
        String enumKey = fieldError != null ? fieldError.getDefaultMessage() : "NULL";

        Map<String, Object> attributes = null;
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        try {
            errorCode = ErrorCode.valueOf(enumKey);
            var firstError = e.getBindingResult().getAllErrors().getFirst();
            ConstraintViolation<?> violation = firstError.unwrap(ConstraintViolation.class);
            attributes = violation.getConstraintDescriptor().getAttributes();
        } catch (IllegalArgumentException ex) {
            log.warn(">>> [Validation Warning] Invalid ErrorCode enum key: {} at [{} {}]",
                    enumKey, request.getMethod(), request.getRequestURI());
        } catch (Exception ex) {
            log.error(">>> [Validation Error] Unexpected error while parsing attributes", ex);
        }

        String errorMessage = attributes != null
                ? mapAttribute(errorCode.getMessage(), attributes)
                : errorCode.getMessage();

        log.warn(">>> [Validation Failed] at [{} {}]: Field '{}' -> {}",
                request.getMethod(), request.getRequestURI(),
                fieldError != null ? fieldError.getField() : "unknown", errorMessage);

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorMessage)
                        .build());
    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String maxValue = String.valueOf(attributes.get(MAX_ATTRIBUTE));
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MAX_ATTRIBUTE + "}", maxValue)
                .replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
