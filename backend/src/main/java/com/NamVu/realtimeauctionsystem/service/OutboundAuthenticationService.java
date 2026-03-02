package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.auth.AuthenticationResponse;

public interface OutboundAuthenticationService {
    AuthenticationResponse outboundAuthentication(String code);
}
