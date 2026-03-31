package com.namvu.realtimeauctionsystem.modules.auth.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.auth.dto.*;
import com.namvu.realtimeauctionsystem.modules.auth.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody @Valid IntrospectRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.of(TOKEN_VERIFIED, authenticationService.introspect(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody @Valid LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.of(LOGOUT, null);
    }

    @PostMapping("/refresh")
    public ApiResponse<RefreshResponse> refreshToken(@RequestBody @Valid RefreshRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.of(TOKEN_REFRESH, authenticationService.refreshToken(request));
    }
}
