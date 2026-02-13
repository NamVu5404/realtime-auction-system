package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.TokenType;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.InvalidatedTokenRepository;
import com.NamVu.realtimeauctionsystem.service.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Value("${jwt.access-key}")
    private String ACCESS_KEY;

    @Value("${jwt.refresh-key}")
    private String REFRESH_KEY;

    @Value("${jwt.valid-duration}")
    private Long VALID_DURATION;

    @Value("${jwt.refreshable-duration}")
    private Long REFRESHABLE_DURATION;

    @Override
    public String generateToken(User user, TokenType type) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .issuer("NamVu.com")
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("scope", user.getRole())
                .issueTime(new Date())
                .jwtID(UUID.randomUUID().toString())
                .expirationTime(type == TokenType.ACCESS_TOKEN
                        ? Date.from(Instant.now().plus(VALID_DURATION, ChronoUnit.HOURS))
                        : Date.from(Instant.now().plus(REFRESHABLE_DURATION, ChronoUnit.HOURS))
                )
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(jwsHeader, payload);

        try {
            if (type == TokenType.ACCESS_TOKEN) {
                jwsObject.sign(new MACSigner(ACCESS_KEY.getBytes()));
            } else {
                jwsObject.sign(new MACSigner(REFRESH_KEY.getBytes()));
            }
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException {
        JWSVerifier verifier;

        if (!isRefresh) {
            verifier = new MACVerifier(ACCESS_KEY.getBytes());
        } else {
            verifier = new MACVerifier(REFRESH_KEY.getBytes());
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
