package com.NamVu.TeamTaskManager.service;

import com.NamVu.TeamTaskManager.dto.request.auth.AuthenticationRequest;
import com.NamVu.TeamTaskManager.dto.request.auth.IntrospectRequest;
import com.NamVu.TeamTaskManager.dto.request.auth.LogoutRequest;
import com.NamVu.TeamTaskManager.dto.request.auth.RefreshRequest;
import com.NamVu.TeamTaskManager.dto.response.auth.AuthenticationResponse;
import com.NamVu.TeamTaskManager.dto.response.auth.IntrospectResponse;
import com.NamVu.TeamTaskManager.dto.response.auth.RefreshResponse;
import com.nimbusds.jose.JOSEException;

import java.text.ParseException;

public interface AuthenticationService {
    AuthenticationResponse authenticate(AuthenticationRequest request);

    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    void logout(LogoutRequest request) throws ParseException, JOSEException;

    RefreshResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}
