package com.namvu.realtimeauctionsystem.modules.auth.service;

import java.time.Instant;

public interface BlacklistTokenService {
    void blacklist(String jti, Instant expiryTime);

    boolean isBlacklisted(String jti);
}
