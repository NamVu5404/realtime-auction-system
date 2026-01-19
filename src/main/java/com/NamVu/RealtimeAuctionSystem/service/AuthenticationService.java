package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.request.auth.AuthenticationRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.LogoutRequest;
import com.NamVu.realtimeauctionsystem.dto.request.auth.RefreshRequest;
import com.NamVu.realtimeauctionsystem.dto.response.auth.AuthenticationResponse;
import com.NamVu.realtimeauctionsystem.dto.response.auth.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.dto.response.auth.RefreshResponse;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface AuthenticationService {
//    AuthenticationResponse authenticate(AuthenticationRequest request);

    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}
