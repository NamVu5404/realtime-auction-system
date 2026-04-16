package com.namvu.realtimeauctionsystem.infrastructure.config;

import com.namvu.realtimeauctionsystem.modules.auth.dto.IntrospectRequest;
import com.namvu.realtimeauctionsystem.modules.auth.dto.IntrospectResponse;
import com.namvu.realtimeauctionsystem.modules.auth.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2ErrorCodes;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;
import java.util.List;
import java.util.Objects;

@Component
@Slf4j
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${jwt.access-key}")
    private String accessKey;

    private final AuthenticationService authenticationService;

    private NimbusJwtDecoder nimbusJwtDecoder = null;

    public CustomJwtDecoder(@Lazy AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @Override
    public Jwt decode(String accessToken) throws JwtException {
        try {
            IntrospectResponse response = authenticationService.introspect(
                    IntrospectRequest.builder().accessToken(accessToken).build());

            if (!response.isValid()) {
                OAuth2Error error = new OAuth2Error(
                        OAuth2ErrorCodes.INVALID_TOKEN,
                        "Token has expired",
                        null
                );
                throw new JwtValidationException("Token has expired", List.of(error));
            }
        } catch (JOSEException | ParseException e) {
            log.warn("JWT validation failed: reason=INTROSPECT_ERROR, errorType={}, message={}",
                    e.getClass().getSimpleName(), e.getMessage());
            throw new JwtException("Token invalid", e);
        }

        if (Objects.isNull(nimbusJwtDecoder)) {
            SecretKeySpec secretKeySpec = new SecretKeySpec(accessKey.getBytes(), "HS512");
            nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                    .macAlgorithm(MacAlgorithm.HS512)
                    .build();
        }

        return nimbusJwtDecoder.decode(accessToken);
    }
}
