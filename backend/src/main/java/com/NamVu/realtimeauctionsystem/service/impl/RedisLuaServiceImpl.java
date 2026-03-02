package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.service.RedisLuaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.scripting.support.ResourceScriptSource;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@Slf4j
public class RedisLuaServiceImpl implements RedisLuaService {

    private static final String AUCTION_KEY_PREFIX = "auction:";

    private final StringRedisTemplate stringRedisTemplate;
    private final RedisScript<List<?>> placeBidScript;

    @SuppressWarnings("unchecked")
    public RedisLuaServiceImpl(RedisTemplate<String, Object> redisTemplate, StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;

        // Load Lua script từ file
        DefaultRedisScript<List<?>> script = new DefaultRedisScript<>();
        script.setScriptSource(new ResourceScriptSource(new ClassPathResource("scripts/place_bid.lua")));
        script.setResultType((Class<List<?>>) (Class<?>) List.class);

        this.placeBidScript = script;
    }

    @Override
    public List<?> executePlaceBid(Long auctionId, BigDecimal newPrice, Long bidderId, long nowEpoch, int maxExtension) {
        List<String> keys = List.of(AUCTION_KEY_PREFIX + auctionId);

        return stringRedisTemplate.execute(
                placeBidScript,
                keys,
                newPrice.toPlainString(),
                bidderId.toString(),
                String.valueOf(nowEpoch),
                String.valueOf(maxExtension)
        );
    }
}
