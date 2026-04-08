package com.namvu.realtimeauctionsystem.modules.auth.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.modules.auth.service.Oauth2AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.LOGIN;

@RestController
@RequestMapping("/v1/auth/oauth2")
@RequiredArgsConstructor
public class Oauth2AuthenticationController {

    private final Oauth2AuthenticationService oauth2AuthenticationService;

    @PostMapping("/authentication")
    public ApiResponse<AuthenticationResponse> oauth2Authentication(@RequestParam("code") String code) {

        AuthenticationResponse result = oauth2AuthenticationService.oauth2Authentication(code);
        return ApiResponse.of(LOGIN, result);
    }
}
