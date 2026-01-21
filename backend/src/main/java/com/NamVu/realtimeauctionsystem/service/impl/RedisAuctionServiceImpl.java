package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.AuctionRedisData;
import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.RedisAuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisAuctionServiceImpl implements RedisAuctionService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedissonClient redissonClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final UserRepository userRepository;

    private static final String AUCTION_KEY_PREFIX = "auction:";
    private static final String LOCK_KEY_PREFIX = "lock:auction:";
    private static final Duration DEFAULT_TTL = Duration.ofDays(7);
    private static final int MAX_EXTENSION = 3;
    private static final String KAFKA_TOPIC = "auction.bid.events";

    /**
     * Khởi tạo dữ liệu auction trong Redis khi auction chuyển sang LIVE
     */
    @Override
    public void initAuction(Long auctionId, BigDecimal startPrice, BigDecimal minStep, Long sellerId, Instant endTime, Integer antiSnipeSeconds, Integer extensionSeconds) {
        String key = AUCTION_KEY_PREFIX + auctionId;

        Map<String, Object> data = new HashMap<>();
        data.put("currentPrice", startPrice.toString());
        data.put("minStep", minStep.toString());
        data.put("highestBidderId", null);
        data.put("sellerId", sellerId.toString());
        data.put("bidCount", 0);
        data.put("lastBidTime", null);
        data.put("endTime", endTime.toString());
        data.put("status", "LIVE");
        data.put("antiSnipeSeconds", antiSnipeSeconds.toString());
        data.put("extensionSeconds", extensionSeconds.toString());
        data.put("extensionCount", "0");
        data.put("version", 0);

        redisTemplate.opsForHash().putAll(key, data);
        redisTemplate.expire(key, DEFAULT_TTL);

        log.info("Initialized auction {} in Redis with start price {}", auctionId, startPrice);
    }

    /**
     * Cập nhật bid với distributed lock để đảm bảo tính nhất quán
     */
    @Override
    public BidUpdateResult updateBidWithLock(Long auctionId, Long bidderId, BigDecimal newPrice) {
        boolean isUserBlocked = userRepository.existsByIdAndStatus(bidderId, UserStatus.BLOCKED);

        if (isUserBlocked) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        String lockKey = LOCK_KEY_PREFIX + auctionId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Chờ tối đa 2s để acquire lock, lock tự động release sau 5s
            boolean acquired = lock.tryLock(2, 5, TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("Failed to acquire lock for auction {}", auctionId);
                return BidUpdateResult.failure("System is busy, please try again");
            }

            String key = AUCTION_KEY_PREFIX + auctionId;

            // Kiểm tra auction có tồn tại không
            if (!redisTemplate.hasKey(key)) {
                log.warn("Auction {} not found in Redis", auctionId);
                return BidUpdateResult.failure("Auction not found");
            }

            // Status check
            String status = (String) redisTemplate.opsForHash().get(key, "status");
            if (!"LIVE".equals(status)) {
                return BidUpdateResult.failure("Auction closed");
            }

            // Lấy giá hiện tại
            String currentPriceStr = (String) redisTemplate.opsForHash().get(key, "currentPrice");
            if (currentPriceStr == null) {
                log.error("Current price not found for auction {}", auctionId);
                return BidUpdateResult.failure("Invalid auction state");
            }
            BigDecimal currentPrice = new BigDecimal(currentPriceStr);

            // Lấy giá trị min step
            String minStepStr = (String) redisTemplate.opsForHash().get(key, "minStep");
            if (minStepStr == null) {
                log.error("Min step not found for auction {}", auctionId);
                return BidUpdateResult.failure("Invalid auction state");
            }
            BigDecimal minStep = new BigDecimal(minStepStr);
            BigDecimal minValidPrice = currentPrice.add(minStep);

            // Kiểm tra giá mới phải lớn hơn giá hiện tại + min step
            if (newPrice.compareTo(minValidPrice) < 0) {
                log.info("Bid rejected: new price {} < min valid price {} for auction {}",
                        newPrice, minValidPrice, auctionId);
                return BidUpdateResult.failure(
                        String.format("Bid must be at least %s", minValidPrice)
                );
            }

            // Anti-sniping
            antiSniping(key, auctionId);

            // Atomic Update
            Instant now = Instant.now();
            redisTemplate.opsForHash().put(key, "currentPrice", newPrice.toString());
            redisTemplate.opsForHash().put(key, "highestBidderId", bidderId.toString());
            redisTemplate.opsForHash().increment(key, "bidCount", 1);
            redisTemplate.opsForHash().put(key, "lastBidTime", now.toString());

            // Increment version (OPTIMISTIC LOCK)
            redisTemplate.opsForHash().increment(key, "version", 1);

            boolean extended = checkAndExtendAuction(auctionId, now);

            // Publish Kafka event
            publishBidEvent(auctionId, bidderId, newPrice, now, extended);

            log.info("Successfully updated bid for auction {}: price={}, bidder={}", auctionId, newPrice, bidderId);
            return BidUpdateResult.success(newPrice, bidderId, null);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Interrupted while acquiring lock for auction {}", auctionId, e);
            return BidUpdateResult.failure("Operation interrupted");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * Lấy giá hiện tại của auction
     */
    @Override
    public BigDecimal getCurrentPrice(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        String priceStr = (String) redisTemplate.opsForHash().get(key, "currentPrice");

        if (priceStr == null) {
            log.warn("Current price not found for auction {}", auctionId);
            return null;
        }

        return new BigDecimal(priceStr);
    }

    /**
     * Lấy ID của người bid cao nhất
     */
    @Override
    public Long getHighestBidderId(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        String bidderIdStr = (String) redisTemplate.opsForHash().get(key, "highestBidderId");

        if (bidderIdStr == null) {
            return null;
        }

        return Long.parseLong(bidderIdStr);
    }

    /**
     * Lấy toàn bộ thông tin auction từ Redis
     */
    @Override
    public AuctionRedisData getAuctionData(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

        if (data.isEmpty()) {
            return null;
        }

        return AuctionRedisData.builder()
                .auctionId(auctionId)
                .currentPrice(new BigDecimal((String) data.get("currentPrice")))
                .highestBidderId(data.get("highestBidderId") != null ?
                        Long.parseLong((String) data.get("highestBidderId")) : null)
                .sellerId(Long.parseLong((String) data.get("sellerId")))
                .bidCount((Integer) data.get("bidCount"))
                .lastBidTime(data.get("lastBidTime") != null ?
                        Instant.parse((String) data.get("lastBidTime")) : null)
                .endTime(Instant.parse((String) data.get("endTime")))
                .status((String) data.get("status"))
                .build();
    }

    /**
     * Cập nhật thời gian kết thúc (cho anti-sniping)
     */
    @Override
    public void updateEndTime(Long auctionId, Instant newEndTime) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        redisTemplate.opsForHash().put(key, "endTime", newEndTime.toString());
        log.info("Updated end time for auction {} to {}", auctionId, newEndTime);
    }

    /**
     * Cập nhật trạng thái auction
     */
    @Override
    public void updateStatus(Long auctionId, String status) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        redisTemplate.opsForHash().put(key, "status", status);
        log.info("Updated status for auction {} to {}", auctionId, status);
    }

    /**
     * Xóa dữ liệu auction khỏi Redis
     */
    @Override
    public void deleteAuction(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        redisTemplate.delete(key);
        log.info("Deleted auction {} from Redis", auctionId);
    }

    /**
     * Kiểm tra auction có tồn tại trong Redis không
     */
    @Override
    public boolean exists(Long auctionId) {
        String key = AUCTION_KEY_PREFIX + auctionId;
        return redisTemplate.hasKey(key);
    }

    /**
     * Check và thêm thời gian nếu phát hiện sniping
     */
    @Override
    public boolean checkAndExtendAuction(Long auctionId, Instant bidTime) {
        String key = AUCTION_KEY_PREFIX + auctionId;

        String endTimeStr = (String) redisTemplate.opsForHash().get(key, "endTime");
        String antiSnipeSecondsStr = (String) redisTemplate.opsForHash().get(key, "antiSnipeSeconds");
        String extensionSecondsStr = (String) redisTemplate.opsForHash().get(key, "extensionSeconds");

        if (endTimeStr == null || antiSnipeSecondsStr == null) {
            throw new AppException(ErrorCode.AUCTION_CONFIG_MISSING);
        }

        Instant endTime = Instant.parse(endTimeStr);
        int antiSnipeSeconds = Integer.parseInt(antiSnipeSecondsStr);
        int extensionSeconds = extensionSecondsStr != null ? Integer.parseInt(extensionSecondsStr) : 30;

        long secondsUntilEnd = Duration.between(bidTime, endTime).getSeconds();

        if (secondsUntilEnd <= antiSnipeSeconds) {
            Instant newEndTime = endTime.plusSeconds(extensionSeconds);

            // Update Redis
            redisTemplate.opsForHash().put(key, "endTime", newEndTime.toString());

            log.info("Auction {} extended to {}", auctionId, newEndTime);
            return true;
        }

        return false;
    }

    /**
     * Đồng bộ dữ liệu từ DB lên Redis
     */
    @Override
    public void syncFromDatabase(Auction auction) {
        initAuction(
                auction.getId(),
                auction.getCurrentPrice(),
                auction.getMinStep(),
                auction.getSeller().getId(),
                auction.getEndTime(),
                auction.getAntiSnipeSeconds(),
                auction.getExtensionSeconds()
        );
    }

    private void antiSniping(String key, Long auctionId) {
        Instant now = Instant.now();

        String endTimeStr = (String) redisTemplate.opsForHash().get(key, "endTime");
        String antiSnipeSecondsStr = (String) redisTemplate.opsForHash().get(key, "antiSnipeSeconds");
        String extensionSecondsStr = (String) redisTemplate.opsForHash().get(key, "extensionSeconds");
        String extensionCountStr = (String) redisTemplate.opsForHash().get(key, "extensionCount");

        if (endTimeStr == null || antiSnipeSecondsStr == null || extensionSecondsStr == null) {
            throw new AppException(ErrorCode.AUCTION_CONFIG_MISSING);
        }

        Instant endTime = Instant.parse(endTimeStr);
        long secondsLeft = Duration.between(now, endTime).getSeconds();

        int antiSnipeSeconds = Integer.parseInt(antiSnipeSecondsStr);
        int extensionSeconds = Integer.parseInt(extensionSecondsStr);
        int extensionCount = extensionCountStr == null ? 0 : Integer.parseInt(extensionCountStr);

        if (secondsLeft <= antiSnipeSeconds && extensionCount < MAX_EXTENSION) {
            Instant newEndTime = endTime.plusSeconds(extensionSeconds);
            redisTemplate.opsForHash().put(key, "endTime", newEndTime.toString());
            redisTemplate.opsForHash().put(key, "extensionCount", String.valueOf(extensionCount + 1));

            log.info("Auction {} extended ({} / {})", auctionId, extensionCount + 1, MAX_EXTENSION);
        }
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
