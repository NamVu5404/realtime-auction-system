package com.namvu.realtimeauctionsystem.modules.auth.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.modules.auth.service.BlacklistTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlacklistTokenServiceImpl implements BlacklistTokenService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void blacklist(String jti, Instant expiryTime) {
        long ttlSeconds = Duration.between(Instant.now(), expiryTime).toSeconds();

        if (ttlSeconds <= 0) {
            log.debug("Token jti={} already expired, skipping blacklist", jti);
            return;
        }

        String key = CacheNameConstant.BLACKLISTED_TOKEN_PREFIX + jti;
        redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(ttlSeconds));
        log.debug("Blacklisted token jti={} with TTL={}s", jti, ttlSeconds);
    }

    @Override
    public boolean isBlacklisted(String jti) {
        String key = CacheNameConstant.BLACKLISTED_TOKEN_PREFIX + jti;
        return redisTemplate.hasKey(key);
    }
}
