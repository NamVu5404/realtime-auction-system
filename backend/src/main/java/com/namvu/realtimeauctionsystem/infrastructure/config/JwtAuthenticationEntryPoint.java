package com.namvu.realtimeauctionsystem.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.common.dto.ErrorResponse;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;

        log.warn(">>> [Security Error] Unauthenticated at [timestamp={}, method={}, uri={}, status={}]: errorType={}, message={}",
                Instant.now(),
                request.getMethod(),
                request.getRequestURI(),
                errorCode.getStatusCode().value(),
                authException.getClass().getSimpleName(),
                authException.getMessage());

        response.setStatus(errorCode.getStatusCode().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse apiResponse = new ErrorResponse(
                errorCode.getCode(),
                errorCode.getMessage(),
                errorCode.getStatusCode().value(),
                request
        );

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        response.flushBuffer();
    }
}
