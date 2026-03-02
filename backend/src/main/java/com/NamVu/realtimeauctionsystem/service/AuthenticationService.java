package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auth.*;
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
