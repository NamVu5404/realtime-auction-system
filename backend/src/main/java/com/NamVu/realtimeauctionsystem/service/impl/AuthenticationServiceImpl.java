package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.request.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.request.LogoutRequest;
import com.NamVu.realtimeauctionsystem.dto.request.RefreshRequest;
import com.NamVu.realtimeauctionsystem.dto.response.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.dto.response.RefreshResponse;
import com.NamVu.realtimeauctionsystem.entity.InvalidatedToken;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.TokenType;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.InvalidatedTokenRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.AuthenticationService;
import com.NamVu.realtimeauctionsystem.service.TokenService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
//    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refreshable-duration}")
    private Long REFRESHABLE_DURATION;

//    @Override
//    public AuthenticationResponse authenticate(AuthenticationRequest request) {
//        User user = userRepository.findByEmailAndStatus(request.getEmail(), UserStatus.ACTIVE)
//                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
//
//        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());
//
//        if (!authenticated)
//            throw new AppException(ErrorCode.UNAUTHENTICATED);
//
//        String accessToken = tokenService.generateToken(user, TokenType.ACCESS_TOKEN);
//        String refreshToken = tokenService.generateToken(user, TokenType.REFRESH_TOKEN);
//
//        return AuthenticationResponse.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .build();
//    }

    @Override
    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        boolean isValid = true;

        try {
            tokenService.verifyToken(request.getAccessToken(), false);
        } catch (AppException e) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    @Override
    public void logout(LogoutRequest request) throws ParseException {
        try {
            disableJwt(request.getAccessToken());
            disableJwt(request.getRefreshToken());
        } catch (AppException e) {
            log.info("Token is invalid");
        }
    }

    @Override
    public RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        SignedJWT signedJWT = tokenService.verifyToken(request.getRefreshToken(), true);

        // xóa token cũ bằng cách logout
        disableJwt(request.getAccessToken());

        // tạo token mới dựa vào subject
        String email = signedJWT.getJWTClaimsSet().getSubject();

        User user = userRepository.findByEmailAndStatus(email, UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        return RefreshResponse.builder()
                .accessToken(tokenService.generateToken(user, TokenType.ACCESS_TOKEN))
                .build();
    }

    private void disableJwt(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(signedJWT.getJWTClaimsSet().getJWTID())
                .expiryTime(signedJWT.getJWTClaimsSet().getExpirationTime().toInstant())
                .build();

        invalidatedTokenRepository.save(invalidatedToken);
    }
}
