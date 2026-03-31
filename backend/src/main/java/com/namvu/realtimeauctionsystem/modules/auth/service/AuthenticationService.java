package com.namvu.realtimeauctionsystem.modules.auth.service;

import com.namvu.realtimeauctionsystem.modules.auth.dto.*;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;

import java.text.ParseException;

public interface AuthenticationService {
    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;

    InfoOsDto getRequestInfo(HttpServletRequest request);
}
