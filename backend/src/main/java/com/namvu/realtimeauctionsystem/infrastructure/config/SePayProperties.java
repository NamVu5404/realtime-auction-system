package com.namvu.realtimeauctionsystem.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "sepay")
@Getter
@Setter
public class SePayProperties {
    private String merchantId = "";
    private String secretKey = "";
    private String baseUrl = "https://pgapi-sandbox.sepay.vn";
    private String checkoutUrl = "https://pay-sandbox.sepay.vn/v1/checkout/init";
    private String frontendUrl = "http://localhost:5173";
}
