package com.namvu.realtimeauctionsystem.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.http.HttpServletRequest;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.time.Instant;

@Getter
@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse extends ApiResponse<Void> {

    private final Instant timestamp;
    private final String method;
    private final String uri;
    private final int status;

    public ErrorResponse(int code, String message, int status, HttpServletRequest request) {
        this.setCode(code);
        this.setMessage(message);
        this.timestamp = Instant.now();
        this.method = request.getMethod();
        this.uri = request.getRequestURI();
        this.status = status;
    }
}

