package com.namvu.realtimeauctionsystem.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.servlet.http.HttpServletRequest;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.Map;

@Getter
@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationErrorResponse extends ErrorResponse {

    private final Map<String, String> errors;

    public ValidationErrorResponse(int code, String message, int status,
                                   HttpServletRequest request, Map<String, String> errors) {
        super(code, message, status, request);
        this.errors = errors;
    }
}
