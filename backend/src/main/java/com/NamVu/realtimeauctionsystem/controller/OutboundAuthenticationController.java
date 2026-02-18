package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.common.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.auth.AuthenticationResponse;
import com.NamVu.realtimeauctionsystem.service.OutboundAuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth/outbound")
@RequiredArgsConstructor
public class OutboundAuthenticationController {

    private final OutboundAuthenticationService outboundAuthenticationService;

    @PostMapping("/authentication")
    ApiResponse<AuthenticationResponse> outboundAuthentication(@RequestParam("code") String code) {

        AuthenticationResponse result = outboundAuthenticationService.outboundAuthentication(code);

        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }
}
