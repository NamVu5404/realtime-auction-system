package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.request.ExchangeTokenRequest;
import com.NamVu.realtimeauctionsystem.dto.response.AuthenticationResponse;
import com.NamVu.realtimeauctionsystem.dto.response.ExchangeTokenResponse;
import com.NamVu.realtimeauctionsystem.dto.response.OutboundUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.httpclient.GoogleAuthClient;
import com.NamVu.realtimeauctionsystem.httpclient.GoogleUserClient;
import com.NamVu.realtimeauctionsystem.service.OutboundAuthenticationService;
import com.NamVu.realtimeauctionsystem.service.OutboundUserService;
import com.NamVu.realtimeauctionsystem.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthenticationServiceImpl implements OutboundAuthenticationService {

    private final GoogleAuthClient googleAuthClient;
    private final GoogleUserClient googleUserClient;
    private final TokenService tokenService;
    private final OutboundUserService outboundUserService;

    @Value("${outbound.google.client-id}")
    private String GOOGLE_CLIENT_ID;

    @Value("${outbound.google.client-secret}")
    private String GOOGLE_CLIENT_SECRET;

    @Value("${outbound.redirect-uri}")
    private String REDIRECT_URI;

    private String GRANT_TYPE = "authorization_code";

    @Override
    public AuthenticationResponse outboundAuthentication(String code) {
        // Exchange token
        ExchangeTokenResponse response = exchangeToken(code);

        // Get user info
        OutboundUserResponse userInfo = getUserInfo(response);
//        log.info("user: {}", userInfo);

        // Onboard user
        User user = outboundUserService.onboardUser(userInfo);

        // Generate JWT
        String token = tokenService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .build();
    }

    private ExchangeTokenResponse exchangeToken(String code) {
        return googleAuthClient.exchangeToken(ExchangeTokenRequest.builder()
                .clientId(GOOGLE_CLIENT_ID)
                .clientSecret(GOOGLE_CLIENT_SECRET)
                .code(code)
                .grantType(GRANT_TYPE)
                .redirectUri(REDIRECT_URI)
                .build());
    }

    private OutboundUserResponse getUserInfo(ExchangeTokenResponse response) {
        return googleUserClient.getUserInfo(response.getAccessToken());
    }
}
