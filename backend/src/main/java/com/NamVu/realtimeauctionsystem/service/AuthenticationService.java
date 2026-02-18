package com.NamVu.realtimeauctionsystem.service;


import com.NamVu.realtimeauctionsystem.dto.auth.InfoOsDto;
import com.NamVu.realtimeauctionsystem.dto.auth.IntrospectRequest;
import com.NamVu.realtimeauctionsystem.dto.auth.LogoutRequest;
import com.NamVu.realtimeauctionsystem.dto.auth.RefreshRequest;
import com.NamVu.realtimeauctionsystem.dto.auth.IntrospectResponse;
import com.NamVu.realtimeauctionsystem.dto.auth.RefreshResponse;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;

import java.text.ParseException;

public interface AuthenticationService {
//    AuthenticationResponse authenticate(AuthenticationRequest request);

    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;

    InfoOsDto getRequestInfo(HttpServletRequest request);
}
