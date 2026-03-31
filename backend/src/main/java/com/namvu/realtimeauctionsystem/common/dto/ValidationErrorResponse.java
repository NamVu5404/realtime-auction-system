package com.namvu.realtimeauctionsystem.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.EqualsAndHashCode;
import lombok.Getter;

import java.util.Map;

@Getter
@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ValidationErrorResponse extends ApiResponse<Void> {

    private final Map<String, String> errors;

    public ValidationErrorResponse(int code, String message, Map<String, String> errors) {
        this.setCode(code);
        this.setMessage(message);
        this.errors = errors;
    }
}
