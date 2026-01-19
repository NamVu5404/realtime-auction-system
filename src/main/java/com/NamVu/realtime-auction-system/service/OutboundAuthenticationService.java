package com.NamVu.TeamTaskManager.service;

import com.NamVu.TeamTaskManager.dto.response.auth.AuthenticationResponse;

public interface OutboundAuthenticationService {
    AuthenticationResponse outboundAuthentication(String code);
}
