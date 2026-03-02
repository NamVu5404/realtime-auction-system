package com.namvu.realtimeauctionsystem.controller;

import com.namvu.realtimeauctionsystem.dto.auth.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.service.OutboundAuthenticationService;
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
    public ApiResponse<AuthenticationResponse> outboundAuthentication(@RequestParam("code") String code) {

        AuthenticationResponse result = outboundAuthenticationService.outboundAuthentication(code);

        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }
}
