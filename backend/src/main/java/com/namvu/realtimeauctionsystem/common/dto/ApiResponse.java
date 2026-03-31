package com.namvu.realtimeauctionsystem.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    private int code = SuccessCode.OK.getCode();
    private String message;
    private T result;

    public static <T> ApiResponse<T> ok(T result) {
        return ApiResponse.<T>builder()
                .code(SuccessCode.OK.getCode())
                .message(SuccessCode.OK.getMessage())
                .result(result)
                .build();
    }

    public static <T> ApiResponse<T> of(SuccessCode code, T result) {
        return ApiResponse.<T>builder()
                .code(code.getCode())
                .message(code.getMessage())
                .result(result)
                .build();
    }
}
