package com.NamVu.realtimeauctionsystem.service;


import com.NamVu.realtimeauctionsystem.dto.request.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.request.LogoutRequest;
import com.NamVu.realtimeauctionsystem.dto.request.RefreshRequest;
import com.NamVu.realtimeauctionsystem.dto.response.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.dto.response.RefreshResponse;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface AuthenticationService {
//    AuthenticationResponse authenticate(AuthenticationRequest request);

    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}
