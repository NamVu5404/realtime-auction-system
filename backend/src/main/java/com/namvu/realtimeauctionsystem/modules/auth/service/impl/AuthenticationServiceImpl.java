package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.TokenType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.utils.RequestUtils;
import com.namvu.realtimeauctionsystem.modules.auth.dto.*;
import com.namvu.realtimeauctionsystem.modules.auth.service.AuthenticationService;
import com.namvu.realtimeauctionsystem.modules.auth.service.BlacklistTokenService;
import com.namvu.realtimeauctionsystem.modules.auth.service.IpLocationService;
import com.namvu.realtimeauctionsystem.modules.auth.service.TokenService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ua_parser.Client;

import java.text.ParseException;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserService userService;
    private final TokenService tokenService;
    private final BlacklistTokenService blacklistTokenService;
    private final IpLocationService ipLocationService;

    private static final String UNKNOWN_VALUE = "Unknown";

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

        User user = userService.getActiveUserByEmail(email);

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

        String ip = RequestUtils.getIpAddress(request);
        String location = ipLocationService.getLocationString(ip);

        return InfoOsDto.builder()
                .browser(browser)
                .os(os)
                .device(device)
                .clientAddress(ip)
                .location(location)
                .build();
    }

    private void disableJwt(String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token);

        String jti = signedJWT.getJWTClaimsSet().getJWTID();
        Instant expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime().toInstant();

        blacklistTokenService.blacklist(jti, expiryTime);
    }
}
