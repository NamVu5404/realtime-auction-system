package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.dto.auction.AuctionRedisData;
import com.namvu.realtimeauctionsystem.dto.bid.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.dto.bid.BidUpdateResult;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.enums.AuctionCacheKey;
import com.namvu.realtimeauctionsystem.enums.AuctionStatus;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisAuctionServiceImpl implements RedisAuctionService {

    private static final String AUCTION_KEY_PREFIX = "auction:";
    private static final String LOCK_KEY_PREFIX = "lock:auction:";
    private static final int MAX_EXTENSION = 3;
    private static final String KAFKA_TOPIC = "auction.bid.events";
    private final StringRedisTemplate stringRedisTemplate;
    private final RedissonClient redissonClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Khởi tạo dữ liệu auction trong Redis khi auction chuyển sang LIVE
     */
    @Override
    public void initAuction(AuctionInitRequest request) {
        String key = AUCTION_KEY_PREFIX + request.getAuctionId();

        Map<String, String> data = new HashMap<>();
        data.put(AuctionCacheKey.CURRENT_PRICE.getValue(), request.getStartPrice().toString());
        data.put(AuctionCacheKey.MIN_STEP.getValue(), request.getMinStep().toString());
        data.put(AuctionCacheKey.HIGHEST_BIDDER_ID.getValue(), "");
        data.put(AuctionCacheKey.SELLER_ID.getValue(), request.getSellerId().toString());
        data.put(AuctionCacheKey.BID_COUNT.getValue(), "0");
        data.put(AuctionCacheKey.LAST_BID_TIME.getValue(), "");
        data.put(AuctionCacheKey.END_TIME.getValue(), String.valueOf(request.getEndTime().getEpochSecond()));
        data.put(AuctionCacheKey.STATUS.getValue(), AuctionStatus.LIVE.name());
        data.put(AuctionCacheKey.ANTI_SNIPE_SECONDS.getValue(), request.getAntiSnipeSeconds().toString());
        data.put(AuctionCacheKey.EXTENSION_SECONDS.getValue(), request.getExtensionSeconds().toString());
        data.put(AuctionCacheKey.EXTENSION_COUNT.getValue(), request.getExtensionCount().toString());
        data.put(AuctionCacheKey.VERSION.getValue(), "0");

        stringRedisTemplate.opsForHash().putAll(key, data);

        long secondsUntilEnd = Duration.between(Instant.now(), request.getEndTime()).getSeconds();
        long bufferSeconds = 24L * 60 * 60;
        long finalTtl = Math.max(secondsUntilEnd + bufferSeconds, 3600);

        stringRedisTemplate.expire(key, Duration.ofSeconds(finalTtl));

        log.info("Initialized auction {} in Redis with start price {}", request.getAuctionId(), request.getStartPrice());
    }

    /**
     * Place bid V1
     * Cập nhật bid với distributed lock để đảm bảo tính nhất quán
     */
    @Override
    public BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice) {
        String lockKey = LOCK_KEY_PREFIX + auctionId;
        RLock lock = redissonClient.getLock(lockKey);
        BidUpdateResult result;
        boolean extended;
        Instant now = Instant.now();

        try {
            boolean acquired = lock.tryLock(500, 2000, TimeUnit.MILLISECONDS);

            if (!acquired) {
                log.warn("Failed to acquire lock for auction {}", auctionId);
                return BidUpdateResult.failure("System is busy, please try again", now);
            }

            String key = AUCTION_KEY_PREFIX + auctionId;

            Map<Object, Object> auctionData = stringRedisTemplate.opsForHash().entries(key);

            if (auctionData.isEmpty()) {
                return BidUpdateResult.failure("Auction not found", now);
            }

            // Status check
            String status = (String) auctionData.get(AuctionCacheKey.STATUS.getValue());
            if (!"LIVE".equals(status)) {
                return BidUpdateResult.failure("Auction closed", now);
            }

            BigDecimal currentPrice = new BigDecimal((String) auctionData.get(AuctionCacheKey.CURRENT_PRICE.getValue()));
            BigDecimal minStep = new BigDecimal((String) auctionData.get(AuctionCacheKey.MIN_STEP.getValue()));
            BigDecimal minValidPrice = currentPrice.add(minStep);

            // Kiểm tra giá mới phải lớn hơn giá hiện tại + min step
            if (newPrice.compareTo(minValidPrice) < 0) {
                log.info("Bid rejected: new price {} < min valid price {} for auction {}",
                        newPrice, minValidPrice, auctionId);
                return BidUpdateResult.failure(
                        String.format("Bid must be at least %s", minValidPrice),
                        now
                );
            }

            // Anti-sniping check
            extended = antiSniping(auctionId, now, auctionData);

            // Atomic update
            stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.CURRENT_PRICE.getValue(), newPrice.toString());
            stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.HIGHEST_BIDDER_ID.getValue(), bidderId.toString());
            stringRedisTemplate.opsForHash().increment(key, AuctionCacheKey.BID_COUNT.getValue(), 1);
            stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.LAST_BID_TIME.getValue(), now.toString());
            stringRedisTemplate.opsForHash().increment(key, AuctionCacheKey.VERSION.getValue(), 1);

            // Gia hạn thời gian
            if (extended) {
                stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.END_TIME.getValue(), auctionData.get(AuctionCacheKey.END_TIME.getValue()));
                stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.EXTENSION_COUNT.getValue(), auctionData.get(AuctionCacheKey.EXTENSION_COUNT.getValue()));
            }

            Instant finalEndTime = (Instant) auctionData.get(AuctionCacheKey.END_TIME.getValue());

            result = BidUpdateResult.success(newPrice, bidderId, now, extended, finalEndTime);
            log.info("Successfully updated bid for auction {}: price={}, bidder={}", auctionId, newPrice, bidderId);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Interrupted while acquiring lock for auction {}", auctionId, e);
            return BidUpdateResult.failure("Operation interrupted", now);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }

        if (result != null && result.isSuccess()) {
            CompletableFuture.runAsync(() ->
                    publishBidEvent(auctionId, bidderId, newPrice, now, extended)
            );
        }

        return result;
    }

    /**
     * Lấy giá hiện tại của auction
     */
    @Override
    public BigDecimal getCurrentPrice(Long auctionId) {
        try {
            String key = AUCTION_KEY_PREFIX + auctionId;
            Object priceObj = stringRedisTemplate.opsForHash().get(key, AuctionCacheKey.CURRENT_PRICE.getValue());

            if (priceObj == null) {
                log.warn("Current price not found for auction {}", auctionId);
                return null;
            }

            return new BigDecimal(String.valueOf(priceObj));
        } catch (Exception e) {
            throw new AppException(ErrorCode.REDIS_DOWN);
        }
    }

    /**
     * Lấy ID của người bid cao nhất
     */
    @Override
    public Long getHighestBidderId(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        Object bidderIdObj = stringRedisTemplate.opsForHash().get(key, AuctionCacheKey.HIGHEST_BIDDER_ID.getValue());

        if (bidderIdObj == null) {
            return null;
        }

        return Long.parseLong(String.valueOf(bidderIdObj));
    }

    /**
     * Lấy toàn bộ thông tin auction từ Redis
     */
    @Override
    public AuctionRedisData getAuctionData(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        Map<Object, Object> data = stringRedisTemplate.opsForHash().entries(key);

        if (data.isEmpty()) {
            return null;
        }

        return AuctionRedisData.builder()
                .auctionId(auctionId)
                .currentPrice(new BigDecimal((String) data.get(AuctionCacheKey.CURRENT_PRICE.getValue())))
                .highestBidderId(data.get(AuctionCacheKey.HIGHEST_BIDDER_ID.getValue()) != null ?
                        Long.parseLong((String) data.get(AuctionCacheKey.HIGHEST_BIDDER_ID.getValue())) : null)
                .sellerId(Long.parseLong((String) data.get(AuctionCacheKey.SELLER_ID.getValue())))
                .bidCount((Integer) data.get(AuctionCacheKey.BID_COUNT.getValue()))
                .lastBidTime(data.get(AuctionCacheKey.LAST_BID_TIME.getValue()) != null ?
                        Instant.parse((String) data.get(AuctionCacheKey.LAST_BID_TIME.getValue())) : null)
                .endTime(Instant.parse((String) data.get(AuctionCacheKey.END_TIME.getValue())))
                .status((String) data.get(AuctionCacheKey.STATUS.getValue()))
                .build();
    }

    /**
     * Cập nhật thời gian kết thúc (cho anti-sniping)
     */
    @Override
    public void updateEndTime(Long auctionId, Instant newEndTime) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.END_TIME.getValue(), newEndTime.toString());
        log.info("Updated end time for auction {} to {}", auctionId, newEndTime);
    }

    /**
     * Cập nhật trạng thái auction
     */
    @Override
    public void updateStatus(Long auctionId, String status) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        stringRedisTemplate.opsForHash().put(key, AuctionCacheKey.STATUS.getValue(), status);
        log.info("Updated status for auction {} to {}", auctionId, status);
    }

    /**
     * Xóa dữ liệu auction khỏi Redis
     */
    @Override
    public void deleteAuction(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        stringRedisTemplate.delete(key);
        log.info("Deleted auction {} from Redis", auctionId);
    }

    /**
     * Kiểm tra auction có tồn tại trong Redis không
     */
    @Override
    public boolean exists(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    /**
     * Đồng bộ dữ liệu từ DB lên Redis
     */
    @Override
    public void syncFromDatabase(Auction auction) {
        String key = AUCTION_KEY_PREFIX + auction.getId();

        Map<String, String> data = new HashMap<>();
        data.put(AuctionCacheKey.CURRENT_PRICE.getValue(), auction.getCurrentPrice().toString());
        data.put(AuctionCacheKey.MIN_STEP.getValue(), auction.getMinStep().toString());
        data.put(AuctionCacheKey.SELLER_ID.getValue(), auction.getSeller().getId().toString());
        data.put(AuctionCacheKey.END_TIME.getValue(), String.valueOf(auction.getEndTime().getEpochSecond()));
        data.put(AuctionCacheKey.STATUS.getValue(), auction.getStatus().name());
        data.put(AuctionCacheKey.ANTI_SNIPE_SECONDS.getValue(), auction.getAntiSnipeSeconds().toString());
        data.put(AuctionCacheKey.EXTENSION_SECONDS.getValue(), auction.getExtensionSeconds().toString());
        data.put(AuctionCacheKey.EXTENSION_COUNT.getValue(), auction.getExtensionCount().toString());

        if (auction.getHighestBidder() != null) {
            data.put(AuctionCacheKey.HIGHEST_BIDDER_ID.getValue(), auction.getHighestBidder().getId().toString());
        } else {
            data.put(AuctionCacheKey.HIGHEST_BIDDER_ID.getValue(), "");
        }

        stringRedisTemplate.opsForHash().putAll(key, data);

        long secondsUntilEnd = Duration.between(Instant.now(), auction.getEndTime()).getSeconds();
        long bufferSeconds = 24L * 60 * 60;
        long finalTtl = Math.max(secondsUntilEnd + bufferSeconds, 3600);
        stringRedisTemplate.expire(key, Duration.ofSeconds(finalTtl));

        log.info("Synced auction {} from DB to Redis with currentPrice {}", auction.getId(), auction.getCurrentPrice());
    }

    private boolean antiSniping(Long auctionId, Instant now, Map<Object, Object> auctionData) {
        String endTimeStr = (String) auctionData.get(AuctionCacheKey.END_TIME.getValue());
        String antiSnipeSecondsStr = (String) auctionData.get(AuctionCacheKey.ANTI_SNIPE_SECONDS.getValue());
        String extensionSecondsStr = (String) auctionData.get(AuctionCacheKey.EXTENSION_SECONDS.getValue());
        String extensionCountStr = (String) auctionData.get(AuctionCacheKey.EXTENSION_COUNT.getValue());

        if (endTimeStr == null || antiSnipeSecondsStr == null || extensionSecondsStr == null) {
            log.error("Auction {} configuration missing in Redis", auctionId);
            return false;
        }

        Instant endTime = Instant.parse(endTimeStr);
        long secondsLeft = Duration.between(now, endTime).getSeconds();

        int antiSnipeSeconds = Integer.parseInt(antiSnipeSecondsStr);
        int extensionSeconds = Integer.parseInt(extensionSecondsStr);
        int extensionCount = extensionCountStr == null ? 0 : Integer.parseInt(extensionCountStr);

        if (secondsLeft <= antiSnipeSeconds && extensionCount < MAX_EXTENSION) {
            Instant newEndTime = endTime.plusSeconds(extensionSeconds);

            auctionData.put(AuctionCacheKey.END_TIME.getValue(), newEndTime.toString());
            auctionData.put(AuctionCacheKey.EXTENSION_COUNT.getValue(), String.valueOf(extensionCount + 1));

            log.info("Auction {} extended ({} / {})", auctionId, extensionCount + 1, MAX_EXTENSION);
            return true;
        }

        return false;
    }

    /**
     * Publish event vào Kafka để DB sync service xử lý
     */
    private void publishBidEvent(Long auctionId, Long bidderId, BigDecimal price, Instant timestamp, boolean extended) {
        BidPlacedEvent event = BidPlacedEvent.builder()
                .auctionId(auctionId)
                .bidderId(bidderId)
                .amount(price)
                .timestamp(timestamp)
                .extended(extended)
                .build();

        kafkaTemplate.send(KAFKA_TOPIC, auctionId.toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish bid event for auction {}", auctionId, ex);
                    } else {
                        log.debug("Published bid event for auction {}", auctionId);
                    }
                });
    }
}
