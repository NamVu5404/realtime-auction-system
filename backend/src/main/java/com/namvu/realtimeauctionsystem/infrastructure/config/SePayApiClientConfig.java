package com.namvu.realtimeauctionsystem.infrastructure.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Configuration
@RequiredArgsConstructor
public class SePayApiClientConfig {

    private final SePayProperties sePayProperties;

    @Bean("sePayRestTemplate")
    RestTemplate sePayRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            String credentials = Base64.getEncoder()
                .encodeToString((sePayProperties.getMerchantId() + ":" + sePayProperties.getSecretKey()).getBytes());
            request.getHeaders().set("Authorization", "Basic " + credentials);
            request.getHeaders().set("Content-Type", "application/json");
            return execution.execute(request, body);
        });
        return restTemplate;
    }
}
