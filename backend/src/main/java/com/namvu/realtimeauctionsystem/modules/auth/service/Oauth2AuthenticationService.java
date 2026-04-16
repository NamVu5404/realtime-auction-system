package com.namvu.realtimeauctionsystem.modules.auth.service;

import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;

public interface Oauth2AuthenticationService {
    AuthenticationResponse oauth2Authentication(String code);
}
