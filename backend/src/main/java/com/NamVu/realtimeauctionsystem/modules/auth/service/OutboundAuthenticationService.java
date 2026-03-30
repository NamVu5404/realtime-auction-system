package com.namvu.realtimeauctionsystem.modules.auth.service;

import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;

public interface OutboundAuthenticationService {
    AuthenticationResponse outboundAuthentication(String code);
}
