package com.namvu.realtimeauctionsystem.service;

import java.math.BigDecimal;
import java.util.List;

public interface RedisLuaService {
    List<?> executePlaceBid(Long auctionId, BigDecimal newPrice, Long bidderId, long nowEpoch, int maxExtension);
}
