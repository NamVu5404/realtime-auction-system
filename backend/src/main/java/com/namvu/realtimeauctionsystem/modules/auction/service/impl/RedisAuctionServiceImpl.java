package com.namvu.realtimeauctionsystem.modules.auction.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.AuctionStatus;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionInitRequest;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionRedisData;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.service.RedisAuctionService;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidPlacedEvent;
import com.namvu.realtimeauctionsystem.modules.bid.dto.BidUpdateResult;
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

import static com.namvu.realtimeauctionsystem.common.constant.AuctionCacheKeyConstant.*;

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
        data.put(TITLE, request.getTitle());
        data.put(CURRENT_PRICE, request.getStartPrice().toString());
        data.put(MIN_STEP, request.getMinStep().toString());
        data.put(HIGHEST_BIDDER_ID, "");
        data.put(SELLER_ID, request.getSellerId().toString());
        data.put(BID_COUNT, "0");
        data.put(LAST_BID_TIME, "");
        data.put(END_TIME, String.valueOf(request.getEndTime().getEpochSecond()));
        data.put(STATUS, AuctionStatus.LIVE.name());
        data.put(ANTI_SNIPE_SECONDS, request.getAntiSnipeSeconds().toString());
        data.put(EXTENSION_SECONDS, request.getExtensionSeconds().toString());
        data.put(EXTENSION_COUNT, request.getExtensionCount().toString());
        data.put(VERSION, "0");

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
            String status = (String) auctionData.get(STATUS);
            if (!"LIVE".equals(status)) {
                return BidUpdateResult.failure("Auction closed", now);
            }

            BigDecimal currentPrice = new BigDecimal((String) auctionData.get(CURRENT_PRICE));
            BigDecimal minStep = new BigDecimal((String) auctionData.get(MIN_STEP));
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
            stringRedisTemplate.opsForHash().put(key, CURRENT_PRICE, newPrice.toString());
            stringRedisTemplate.opsForHash().put(key, HIGHEST_BIDDER_ID, bidderId.toString());
            stringRedisTemplate.opsForHash().increment(key, BID_COUNT, 1);
            stringRedisTemplate.opsForHash().put(key, LAST_BID_TIME, now.toString());
            stringRedisTemplate.opsForHash().increment(key, VERSION, 1);

            // Gia hạn thời gian
            if (extended) {
                stringRedisTemplate.opsForHash().put(key, END_TIME, auctionData.get(END_TIME));
                stringRedisTemplate.opsForHash().put(key, EXTENSION_COUNT, auctionData.get(EXTENSION_COUNT));
            }

            Instant finalEndTime = (Instant) auctionData.get(END_TIME);

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
     * Lấy title của auction
     */
    @Override
    public String getAuctionTitle(Long auctionId) {
        try {
            String key = AUCTION_KEY_PREFIX + auctionId;
            Object priceObj = stringRedisTemplate.opsForHash().get(key, TITLE);

            if (priceObj == null) {
                log.warn("Title not found for auction {}", auctionId);
                return null;
            }

            return String.valueOf(priceObj);
        } catch (Exception e) {
            throw new AppException(ErrorCode.REDIS_DOWN);
        }
    }

    /**
     * Lấy giá hiện tại của auction
     */
    @Override
    public BigDecimal getCurrentPrice(Long auctionId) {
        try {
            String key = AUCTION_KEY_PREFIX + auctionId;
            Object priceObj = stringRedisTemplate.opsForHash().get(key, CURRENT_PRICE);

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
        Object bidderIdObj = stringRedisTemplate.opsForHash().get(key, HIGHEST_BIDDER_ID);

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
                .currentPrice(new BigDecimal((String) data.get(CURRENT_PRICE)))
                .highestBidderId(data.get(HIGHEST_BIDDER_ID) != null ?
                        Long.parseLong((String) data.get(HIGHEST_BIDDER_ID)) : null)
                .sellerId(Long.parseLong((String) data.get(SELLER_ID)))
                .bidCount((Integer) data.get(BID_COUNT))
                .lastBidTime(data.get(LAST_BID_TIME) != null ?
                        Instant.parse((String) data.get(LAST_BID_TIME)) : null)
                .endTime(Instant.parse((String) data.get(END_TIME)))
                .status((String) data.get(STATUS))
                .build();
    }

    /**
     * Cập nhật thời gian kết thúc (cho anti-sniping)
     */
    @Override
    public void updateEndTime(Long auctionId, Instant newEndTime) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        stringRedisTemplate.opsForHash().put(key, END_TIME, newEndTime.toString());
        log.info("Updated end time for auction {} to {}", auctionId, newEndTime);
    }

    /**
     * Cập nhật trạng thái auction
     */
    @Override
    public void updateStatus(Long auctionId, String status) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        stringRedisTemplate.opsForHash().put(key, STATUS, status);
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
        data.put(TITLE, auction.getTitle());
        data.put(CURRENT_PRICE, auction.getCurrentPrice().toString());
        data.put(MIN_STEP, auction.getMinStep().toString());
        data.put(SELLER_ID, auction.getSeller().getId().toString());
        data.put(END_TIME, String.valueOf(auction.getEndTime().getEpochSecond()));
        data.put(STATUS, auction.getStatus().name());
        data.put(ANTI_SNIPE_SECONDS, auction.getAntiSnipeSeconds().toString());
        data.put(EXTENSION_SECONDS, auction.getExtensionSeconds().toString());
        data.put(EXTENSION_COUNT, auction.getExtensionCount().toString());

        if (auction.getHighestBidder() != null) {
            data.put(HIGHEST_BIDDER_ID, auction.getHighestBidder().getId().toString());
        } else {
            data.put(HIGHEST_BIDDER_ID, "");
        }

        stringRedisTemplate.opsForHash().putAll(key, data);

        long secondsUntilEnd = Duration.between(Instant.now(), auction.getEndTime()).getSeconds();
        long bufferSeconds = 24L * 60 * 60;
        long finalTtl = Math.max(secondsUntilEnd + bufferSeconds, 3600);
        stringRedisTemplate.expire(key, Duration.ofSeconds(finalTtl));

        log.info("Synced auction {} from DB to Redis with currentPrice {}", auction.getId(), auction.getCurrentPrice());
    }

    private boolean antiSniping(Long auctionId, Instant now, Map<Object, Object> auctionData) {
        String endTimeStr = (String) auctionData.get(END_TIME);
        String antiSnipeSecondsStr = (String) auctionData.get(ANTI_SNIPE_SECONDS);
        String extensionSecondsStr = (String) auctionData.get(EXTENSION_SECONDS);
        String extensionCountStr = (String) auctionData.get(EXTENSION_COUNT);

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

            auctionData.put(END_TIME, newEndTime.toString());
            auctionData.put(EXTENSION_COUNT, String.valueOf(extensionCount + 1));

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
