package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auth.*;
import com.namvu.realtimeauctionsystem.entity.InvalidatedToken;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.TokenType;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.InvalidatedTokenRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.AuthenticationService;
import com.namvu.realtimeauctionsystem.service.TokenService;
import com.namvu.realtimeauctionsystem.utils.RequestUtils;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua_parser.Client;

import java.text.ParseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    private static final String UNKNOWN_VALUE = "Unknown";

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

    @Override
    public InfoOsDto getRequestInfo(HttpServletRequest request) {
        Client userAgent = RestAuthenticationDetailsDto.getUserAgent(request);
        String browser = UNKNOWN_VALUE;
        String os = UNKNOWN_VALUE;
        String device = UNKNOWN_VALUE;

        if (userAgent != null) {
            if (userAgent.userAgent != null)
                browser = RequestUtils.formatVersion(userAgent.userAgent.family, userAgent.userAgent.major, userAgent.userAgent.minor);
            if (userAgent.os != null)
                os = RequestUtils.formatVersion(userAgent.os.family, userAgent.os.major, userAgent.os.minor, userAgent.os.patch);
            if (userAgent.device != null)
                device = userAgent.device.family;
        }

        return InfoOsDto.builder()
                .browser(browser)
                .os(os)
                .device(device)
                .clientAddress(RequestUtils.getIpAddress(request))
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
