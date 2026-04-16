package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.TokenType;
import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenRequest;
import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.Oauth2UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.GoogleAuthClient;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.GoogleUserClient;
import com.namvu.realtimeauctionsystem.modules.user.mapper.UserMapper;
import com.namvu.realtimeauctionsystem.modules.auth.service.Oauth2AuthenticationService;
import com.namvu.realtimeauctionsystem.modules.user.service.Oauth2UserService;
import com.namvu.realtimeauctionsystem.modules.auth.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthenticationServiceImpl implements Oauth2AuthenticationService {

    private final GoogleAuthClient googleAuthClient;
    private final GoogleUserClient googleUserClient;
    private final TokenService tokenService;
    private final Oauth2UserService oauth2UserService;
    private final UserMapper userMapper;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    private static final String GRANT_TYPE = "authorization_code";

    @Override
    public AuthenticationResponse oauth2Authentication(String code) {
        // Exchange token
        ExchangeTokenResponse response = exchangeToken(code);

        // Get user info
        Oauth2UserResponse userInfo = getUserInfo(response);

        // Onboard user
        User user = oauth2UserService.onboardUser(userInfo);

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

    private Oauth2UserResponse getUserInfo(ExchangeTokenResponse response) {
        return googleUserClient.getUserInfo(response.getAccessToken());
    }
}
