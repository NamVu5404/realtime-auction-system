package com.namvu.realtimeauctionsystem.common.exception;

import com.namvu.realtimeauctionsystem.common.dto.ErrorResponse;
import com.namvu.realtimeauctionsystem.common.dto.ValidationErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    public ResponseEntity<ErrorResponse> exceptionHandler(Exception e, HttpServletRequest request) {
        ErrorCode errorCode = ErrorCode.INTERNAL_ERROR;
        log.error(">>> [System Error] Unhandled exception occurred at [{}]: ",
                buildLogContext(request, errorCode.getStatusCode().value()), e);

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(new ErrorResponse(
                        errorCode.getCode(),
                        errorCode.getMessage(),
                        errorCode.getStatusCode().value(),
                        request
                ));
    }

    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ErrorResponse> customExceptionHandler(AppException e, HttpServletRequest request) {
        ErrorCode errorCode = e.getErrorCode();
        log.warn(">>> [Business Error] at [{}]: Code: {}, Message: {}",
                buildLogContext(request, errorCode.getStatusCode().value()), errorCode.getCode(), errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(new ErrorResponse(
                        errorCode.getCode(),
                        errorCode.getMessage(),
                        errorCode.getStatusCode().value(),
                        request
                ));
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> accessDeniedExceptionHandler(AccessDeniedException e, HttpServletRequest request) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        log.warn(">>> [Security Error] Access Denied at [{}]: {}",
                buildLogContext(request, errorCode.getStatusCode().value()), e.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(new ErrorResponse(
                        errorCode.getCode(),
                        errorCode.getMessage(),
                        errorCode.getStatusCode().value(),
                        request
                ));
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> methodArgumentNotValidExceptionHandler(
            MethodArgumentNotValidException e, HttpServletRequest request) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        log.warn(">>> [Validation Failed] at [{}]: {}",
                buildLogContext(request, ErrorCode.FIELD_INVALID.getStatusCode().value()), fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(new ValidationErrorResponse(
                        ErrorCode.FIELD_INVALID.getCode(),
                        ErrorCode.FIELD_INVALID.getMessage(),
                        ErrorCode.FIELD_INVALID.getStatusCode().value(),
                        request,
                        fieldErrors
                ));
    }

    private String buildLogContext(HttpServletRequest request, int statusCode) {
        return String.format("timestamp=%s, method=%s, uri=%s, status=%d",
                Instant.now(), request.getMethod(), request.getRequestURI(), statusCode);
    }
}
