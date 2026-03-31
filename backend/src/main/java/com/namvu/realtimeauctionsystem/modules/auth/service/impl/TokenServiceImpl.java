package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.common.constant.TokenType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.auth.repository.InvalidatedTokenRepository;
import com.namvu.realtimeauctionsystem.modules.auth.service.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenServiceImpl implements TokenService {

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Value("${jwt.access-key}")
    private String accessKey;

    @Value("${jwt.refresh-key}")
    private String refreshKey;

    @Value("${jwt.valid-duration}")
    private Long validDuration;

    @Value("${jwt.refreshable-duration}")
    private Long refreshableDuration;

    @Override
    public String generateToken(User user, TokenType type) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        String scope = user.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.joining(" "));

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .issuer("namvu.com")
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("scope", scope)
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .expirationTime(type == TokenType.ACCESS_TOKEN
                        ? Date.from(Instant.now().plus(validDuration, ChronoUnit.HOURS))
                        : Date.from(Instant.now().plus(refreshableDuration, ChronoUnit.HOURS))
                )
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            if (type == TokenType.ACCESS_TOKEN) {
                jwsObject.sign(new MACSigner(accessKey.getBytes()));
            } else {
                jwsObject.sign(new MACSigner(refreshKey.getBytes()));
            }
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Failed to sign {} due to cryptographic error", type, e);
            throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
        }
    }

    @Override
    public SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException {
        JWSVerifier verifier;

        if (!isRefresh) {
            verifier = new MACVerifier(accessKey.getBytes());
        } else {
            verifier = new MACVerifier(refreshKey.getBytes());
        }

        SignedJWT signedJWT = SignedJWT.parse(token);

        String jti = signedJWT.getJWTClaimsSet().getJWTID();
        Date expirationDate = signedJWT.getJWTClaimsSet().getExpirationTime();

        boolean verified = signedJWT.verify(verifier);

        if (!(verified && expirationDate.after(new Date())))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidatedTokenRepository.existsById(jti))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }
}
