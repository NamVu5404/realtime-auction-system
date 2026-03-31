package com.namvu.realtimeauctionsystem.infrastructure.http_clients;

import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenRequest;
import com.namvu.realtimeauctionsystem.modules.auth.dto.ExchangeTokenResponse;
import feign.QueryMap;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(name = "google-auth-client", url = "https://oauth2.googleapis.com")
public interface GoogleAuthClient {
    /*
     * client-side: gửi request nhận response
     * Post request(code, ...) lên token_uri để exchange Token
     */
    @PostMapping(value = "/token", produces = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    ExchangeTokenResponse exchangeToken(@QueryMap ExchangeTokenRequest request);
}
