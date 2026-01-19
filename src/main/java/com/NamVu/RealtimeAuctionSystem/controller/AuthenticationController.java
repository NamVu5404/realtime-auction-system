package com.NamVu.realtimeauctionsystem.controller;

import com.NamVu.realtimeauctionsystem.dto.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.request.auth.AuthenticationRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.LogoutRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.RefreshRequest;
import com.NamVu.realtimeauctionsystem.dto.response.auth.AuthenticationResponse;
import com.NamVu.realtimeauctionsystem.dto.response.auth.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.dto.response.auth.RefreshResponse;
import com.NamVu.realtimeauctionsystem.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

//    @PostMapping("/login")
//    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
//        return ApiResponse.<AuthenticationResponse>builder()
//                .result(authenticationService.authenticate(request))
//                .build();
//    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<IntrospectResponse>builder()
                .result(authenticationService.introspect(request))
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<?> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.builder().build();
    }

    @PostMapping("/refresh")
    ApiResponse<RefreshResponse> refreshToken(@RequestBody RefreshRequest request)
            throws ParseException, JOSEException {
        return ApiResponse.<RefreshResponse>builder()
                .result(authenticationService.refreshToken(request))
                .build();
    }
}
