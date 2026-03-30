package com.namvu.realtimeauctionsystem.modules.auth.controller;

import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.auth.service.OutboundAuthenticationService;
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
