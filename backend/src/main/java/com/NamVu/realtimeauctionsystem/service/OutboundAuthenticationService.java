package com.NamVu.realtimeauctionsystem.service;


import com.NamVu.realtimeauctionsystem.dto.auth.AuthenticationResponse;

public interface OutboundAuthenticationService {
    AuthenticationResponse outboundAuthentication(String code);
}
