package com.NamVu.realtimeauctionsystem.configuration;

import com.NamVu.realtimeauctionsystem.dto.auth.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.auth.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;
import java.util.Objects;

@Component
@Slf4j
public class CustomJwtDecoder implements JwtDecoder {

    @Value("${jwt.access-key}")
    private String ACCESS_KEY;

    @Autowired
    @Lazy
    private AuthenticationService authenticationService;

    private NimbusJwtDecoder nimbusJwtDecoder = null;

    @Override
    public Jwt decode(String accessToken) throws JwtException {
        try {
            IntrospectResponse response = authenticationService.introspect(
                    IntrospectRequest.builder().accessToken(accessToken).build());

            if (!response.isValid()) {
                log.warn("Unauthenticated");
            }
        } catch (JOSEException | ParseException e) {
            log.warn("Token Invalid");
        }

        if (Objects.isNull(nimbusJwtDecoder)) {
            SecretKeySpec secretKeySpec = new SecretKeySpec(ACCESS_KEY.getBytes(), "HS512");
            nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                    .macAlgorithm(MacAlgorithm.HS512)
                    .build();
        }

        return nimbusJwtDecoder.decode(accessToken);
    }
}
