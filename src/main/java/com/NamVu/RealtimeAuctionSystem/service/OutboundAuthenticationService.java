package com.NamVu.realtimeauctionsystem.service;


import com.NamVu.realtimeauctionsystem.dto.response.AuthenticationResponse;

public interface OutboundAuthenticationService {
    AuthenticationResponse outboundAuthentication(String code);
}
