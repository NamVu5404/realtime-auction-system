package com.NamVu.realtimeauctionsystem.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.redis.AutoConfigureDataRedis;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureDataRedis
@ActiveProfiles("test")
public class RedisLuaServiceTest {

    @Autowired
    private RedisLuaService redisLuaService;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    private static final Long AUCTION_ID = 1L;
    private static final Long BIDDER_ID = 100L;
    private static final Long SELLER_ID = 200L;

    @BeforeEach
    void setup() {
        String key = "auction:" + AUCTION_ID;
        Map<String, String> data = new HashMap<>();  // ← String, String
        data.put("currentPrice", "1000");
        data.put("minStep", "100");
        data.put("sellerId", SELLER_ID.toString());
        data.put("status", "LIVE");
        data.put("endTime", String.valueOf(Instant.now().plusSeconds(300).getEpochSecond()));
        data.put("antiSnipeSeconds", "10");
        data.put("extensionSeconds", "15");
        data.put("extensionCount", "0");
        data.put("bidCount", "0");
        data.put("version", "0");

        stringRedisTemplate.opsForHash().putAll(key, data);
    }

    @AfterEach
    void cleanup() {
        stringRedisTemplate.delete("auction:" + AUCTION_ID);
    }

    // ✅ Test bid hợp lệ
    @Test
    void testValidBid() {
        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1200"), BIDDER_ID,
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(1L, result.get(0));                // status = success
        assertEquals("Success", result.get(1));         // message
        assertEquals("normal", result.get(2));          // no extension

        // Verify Redis updated
        String price = (String) stringRedisTemplate.opsForHash()
                .get("auction:" + AUCTION_ID, "currentPrice");
        assertEquals("1200", price);
    }

    // ❌ Test giá quá thấp
    @Test
    void testBidTooLow() {
        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1050"), BIDDER_ID,
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(0L, result.get(0));                // status = fail
        assertTrue(((String) result.get(1)).contains("Bid must be at least"));
    }

    // ❌ Test seller bid own auction
    @Test
    void testSellerBidOwnAuction() {
        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1200"), SELLER_ID,  // seller = bidder
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(0L, result.get(0));
        assertEquals("Cannot bid on your own auction", result.get(1));
    }

    // ❌ Test auction not found
    @Test
    void testAuctionNotFound() {
        List<?> result = redisLuaService.executePlaceBid(
                999L, new BigDecimal("1200"), BIDDER_ID,        // auction 999 không tồn tại
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(0L, result.get(0));
        assertEquals("Auction not found", result.get(1));
    }

    // ❌ Test auction not live
    @Test
    void testAuctionNotLive() {
        stringRedisTemplate.opsForHash().put("auction:" + AUCTION_ID, "status", "ENDED");

        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1200"), BIDDER_ID,
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(0L, result.get(0));
        assertEquals("Auction is not live", result.get(1));
    }

    // ✅ Test anti-snipe extension
    @Test
    void testAntiSnipeExtension() {
        // Set endTime = now + 5s (trong antiSnipeSeconds = 10s)
        long endTime = Instant.now().plusSeconds(5).getEpochSecond();
        stringRedisTemplate.opsForHash().put("auction:" + AUCTION_ID, "endTime", String.valueOf(endTime));

        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1200"), BIDDER_ID,
                Instant.now().getEpochSecond(), 3
        );

        assertEquals(1L, result.get(0));
        assertEquals("extended", result.get(2));        // đã gia hạn

        // Verify extensionCount tăng
        String count = (String) stringRedisTemplate.opsForHash()
                .get("auction:" + AUCTION_ID, "extensionCount");
        assertEquals("1", count);
    }

    // ❌ Test max extension reached
    @Test
    void testMaxExtensionReached() {
        long endTime = Instant.now().plusSeconds(5).getEpochSecond();
        stringRedisTemplate.opsForHash().put("auction:" + AUCTION_ID, "endTime", String.valueOf(endTime));
        stringRedisTemplate.opsForHash().put("auction:" + AUCTION_ID, "extensionCount", "3"); // đã max

        List<?> result = redisLuaService.executePlaceBid(
                AUCTION_ID, new BigDecimal("1200"), BIDDER_ID,
                Instant.now().getEpochSecond(), 3  // maxExtension = 3
        );

        assertEquals(1L, result.get(0));                // vẫn cho bid
        assertEquals("normal", result.get(2));          // nhưng không extend
    }

    // ✅ Test concurrent bids (race condition)
    @Test
    void testConcurrentBids() throws Exception {
        int threadCount = 100;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        List<Future<List<?>>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            final long bidderId = 1000L + i;
            final BigDecimal price = new BigDecimal("1200");

            futures.add(executor.submit(() ->
                    redisLuaService.executePlaceBid(
                            AUCTION_ID, price, bidderId,
                            Instant.now().getEpochSecond(), 3
                    )
            ));
        }

        // Count success/fail
        long successCount = 0;
        for (Future<List<?>> future : futures) {
            List<?> result = future.get();
            if ((Long) result.getFirst() == 1L) successCount++;
        }

        executor.shutdown();

        // Chỉ 1 bid thành công với giá 1200 (rest bị reject vì giá quá thấp)
        assertEquals(1, successCount);

        // Verify version increment = 1
        String version = (String) stringRedisTemplate.opsForHash()
                .get("auction:" + AUCTION_ID, "version");
        assertEquals("1", version);
    }
}
