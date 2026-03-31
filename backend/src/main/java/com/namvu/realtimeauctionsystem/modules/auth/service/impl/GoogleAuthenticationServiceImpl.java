package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenRequest;
import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.OutboundUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.common.enums.TokenType;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.GoogleAuthClient;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.GoogleUserClient;
import com.namvu.realtimeauctionsystem.modules.user.mapper.UserMapper;
import com.namvu.realtimeauctionsystem.modules.auth.service.OutboundAuthenticationService;
import com.namvu.realtimeauctionsystem.modules.user.service.OutboundUserService;
import com.namvu.realtimeauctionsystem.modules.auth.service.TokenService;
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
    private final UserMapper userMapper;

    @Value("${outbound.google.client-id}")
    private String googleClientId;

    @Value("${outbound.google.client-secret}")
    private String googleClientSecret;

    @Value("${outbound.redirect-uri}")
    private String redirectUri;

    private static final String GRANT_TYPE = "authorization_code";

    @Override
    public AuthenticationResponse outboundAuthentication(String code) {
        // Exchange token
        ExchangeTokenResponse response = exchangeToken(code);

        // Get user info
        OutboundUserResponse userInfo = getUserInfo(response);

        // Onboard user
        User user = outboundUserService.onboardUser(userInfo);

        // Generate JWT
        String accessToken = tokenService.generateToken(user, TokenType.ACCESS_TOKEN);
        String refreshToken = tokenService.generateToken(user, TokenType.REFRESH_TOKEN);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.mapToResponse(user))
                .build();
    }

    private ExchangeTokenResponse exchangeToken(String code) {
        return googleAuthClient.exchangeToken(ExchangeTokenRequest.builder()
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .code(code)
                .grantType(GRANT_TYPE)
                .redirectUri(redirectUri)
                .build());
    }

    private OutboundUserResponse getUserInfo(ExchangeTokenResponse response) {
        return googleUserClient.getUserInfo(response.getAccessToken());
    }
}
