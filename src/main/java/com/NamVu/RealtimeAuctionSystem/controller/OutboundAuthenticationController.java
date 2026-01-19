package com.NamVu.TeamTaskManager.controller;

import com.NamVu.TeamTaskManager.dto.ApiResponse;
import com.NamVu.TeamTaskManager.dto.response.auth.AuthenticationResponse;
import com.NamVu.TeamTaskManager.service.OutboundAuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/outbound")
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
