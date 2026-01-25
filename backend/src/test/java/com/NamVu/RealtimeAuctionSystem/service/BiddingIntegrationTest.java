package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.RealtimeAuctionSystemApplication;
import com.NamVu.realtimeauctionsystem.dto.BidUpdateResult;
import com.NamVu.realtimeauctionsystem.dto.CustomUserDetails;
import com.NamVu.realtimeauctionsystem.entity.Auction;
import com.NamVu.realtimeauctionsystem.entity.Bid;
import com.NamVu.realtimeauctionsystem.entity.FraudLog;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.*;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.NamVu.realtimeauctionsystem.repository.BidRepository;
import com.NamVu.realtimeauctionsystem.repository.FraudLogRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = RealtimeAuctionSystemApplication.class)
@Testcontainers
@EmbeddedKafka(
        partitions = 1,
        topics = {"auction.bid.events"}
)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BiddingIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("testdb");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> mysql.getJdbcUrl() + "?createDatabaseIfNotExist=true");
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);

        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
    }

    @Autowired
    private RedisAuctionService redisAuctionService;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private FraudLogRepository fraudLogRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private User seller;
    private User bidder1;
    private User bidder2;
    private Auction auction;

    private void loginAs(User user, UserStatus userStatus) {
        CustomUserDetails principal = CustomUserDetails.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .status(userStatus)
                .role(Role.USER)
                .build();

        Authentication auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities()
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @BeforeEach
    void setUp() {
        // Clear data
        assertNotNull(redisTemplate.getConnectionFactory());
        redisTemplate.getConnectionFactory().getConnection().flushAll();

        // Clear DB
        fraudLogRepository.deleteAll();
        bidRepository.deleteAll();
        auctionRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        seller = userRepository.save(User.builder()
                .name("seller")
                .email("seller@test.com")
                .build());

        bidder1 = userRepository.save(User.builder()
                .name("bidder1")
                .email("bidder1@test.com")
                .build());

        bidder2 = userRepository.save(User.builder()
                .name("bidder2")
                .email("bidder2@test.com")
                .build());

        // Create auction
        auction = auctionRepository.save(Auction.builder()
                .title("Test Auction")
                .startPrice(new BigDecimal("1000.00"))
                .currentPrice(new BigDecimal("1000.00"))
                .minStep(new BigDecimal("50.00"))
                .seller(seller)
                .status(AuctionStatus.LIVE)
                .startTime(Instant.now())
                .endTime(Instant.now().plus(1, ChronoUnit.HOURS))
                .antiSnipeSeconds(60)
                .extensionSeconds(30)
                .build());

        // Init Redis
        redisAuctionService.initAuction(
                auction.getId(),
                auction.getStartPrice(),
                auction.getMinStep(),
                seller.getId(),
                auction.getEndTime(),
                auction.getAntiSnipeSeconds(),
                auction.getExtensionSeconds()
        );
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ============================================
    // TEST CASE 1: BID THÀNH CÔNG
    // ============================================

    @Test
    @DirtiesContext
    @DisplayName("TC1: Bid thành công với giá hợp lệ")
    void shouldPlaceBidSuccessfully() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given
        BigDecimal bidPrice = new BigDecimal("1050.00"); // currentPrice + minStep

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), bidPrice
        );

        // Then
        assertTrue(result.isSuccess());
        assertEquals(bidPrice, result.getNewPrice());

        // Verify Redis
        assertEquals(0, bidPrice.compareTo(redisAuctionService.getCurrentPrice(auction.getId())));
        assertEquals(bidder1.getId(), redisAuctionService.getHighestBidderId(auction.getId()));

        // Wait for Kafka consumer
        Thread.sleep(2000);

        // Verify DB
        Auction updated = auctionRepository.findById(auction.getId()).get();
        assertEquals(bidPrice, updated.getCurrentPrice());
        assertEquals(bidder1.getId(), updated.getHighestBidder().getId());

        // Verify Bid record
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        assertEquals(1, bids.size());
        assertEquals(BidStatus.ACCEPTED, bids.getFirst().getStatus());
    }

    // ============================================
    // TEST CASE 2: BID BỊ TỪ CHỐI - GIÁ THẤP HƠN MIN
    // ============================================

    @Test
    @DisplayName("TC2: Từ chối bid khi giá < currentPrice + minStep")
    void shouldRejectBidWhenPriceTooLow() {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: minStep = 50, currentPrice = 1000
        BigDecimal bidPrice = new BigDecimal("1040.00"); // < 1050

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), bidPrice
        );

        // Then
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("at least"));

        // Redis không thay đổi
        assertEquals(new BigDecimal("1000.00"),
                redisAuctionService.getCurrentPrice(auction.getId()));
    }

    @Test
    @DisplayName("TC2.1: Từ chối bid khi giá bằng currentPrice")
    void shouldRejectBidWhenPriceEqualsCurrent() {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given
        BigDecimal bidPrice = new BigDecimal("1000.00"); // = currentPrice

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), bidPrice
        );

        // Then
        assertFalse(result.isSuccess());
    }

    @Test
    @DisplayName("TC2.2: Chấp nhận bid khi giá = currentPrice + minStep")
    void shouldAcceptBidWhenPriceEqualsMinimum() {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given
        BigDecimal bidPrice = new BigDecimal("1050.00"); // = currentPrice + minStep

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), bidPrice
        );

        // Then
        assertTrue(result.isSuccess());
    }

    // ============================================
    // TEST CASE 3: BID ĐỒNG THỜI
    // ============================================

    @Test
    @DisplayName("TC3: Xử lý 2 bid cùng lúc - chỉ 1 thành công")
    void shouldHandleConcurrentBidsCorrectly() throws InterruptedException {
        // Given
        BigDecimal price1 = new BigDecimal("1100.00");
        BigDecimal price2 = new BigDecimal("1100.00"); // Cùng giá

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(2);
        List<BidUpdateResult> results = Collections.synchronizedList(new ArrayList<>());

        // When: 2 bids cùng lúc
        executor.submit(() -> {
            try {
                loginAs(bidder1, UserStatus.ACTIVE);
                BidUpdateResult result = redisAuctionService.updateBidWithLock(
                        auction.getId(), bidder1.getId(), price1
                );
                results.add(result);
            } finally {
                latch.countDown();
            }
        });

        executor.submit(() -> {
            try {
                loginAs(bidder2, UserStatus.ACTIVE);
                BidUpdateResult result = redisAuctionService.updateBidWithLock(
                        auction.getId(), bidder2.getId(), price2
                );
                results.add(result);
            } finally {
                latch.countDown();
            }
        });

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Then: Chỉ 1 bid thành công
        long successCount = results.stream().filter(BidUpdateResult::isSuccess).count();
        assertEquals(1, successCount, "Only one bid should succeed");

        // Verify final price
        assertEquals(0, new BigDecimal("1100.00").compareTo(redisAuctionService.getCurrentPrice(auction.getId())));
    }

    // ============================================
    // TEST CASE 4: FRAUD DETECTION - SELF BIDDING
    // ============================================

    @Test
    @DisplayName("TC4: Phát hiện self-bidding và gán FLAGGED")
    void shouldFlagSelfBidding() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: Seller tự bid
        BigDecimal bidPrice = new BigDecimal("1050.00");

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), seller.getId(), bidPrice
        );

        // Then: Redis vẫn accept (vì check fraud ở DB layer)
        assertTrue(result.isSuccess());

        // Wait for Kafka
        Thread.sleep(2000);

        // Verify: Bid bị FLAGGED
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        assertEquals(1, bids.size());
        assertEquals(BidStatus.FLAGGED, bids.getFirst().getStatus());

        // Verify: FraudLog created
        List<FraudLog> fraudLogs = fraudLogRepository.findByUserIdOrderByCreatedAtDesc(seller.getId());
        assertEquals(1, fraudLogs.size());
        assertEquals(FraudType.SELF_BIDDING, fraudLogs.getFirst().getType());
    }

    // ============================================
    // TEST CASE 5: FRAUD DETECTION - RATE LIMIT
    // ============================================

    @Test
    @DisplayName("TC5: Phát hiện rate limit (>10 bids/60s) và gán FLAGGED")
    void shouldFlagRateLimitViolation() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: Tạo 11 bids trong 60s
        for (int i = 1; i <= 11; i++) {
            BigDecimal price = new BigDecimal("1000.00").add(BigDecimal.valueOf(i * 50));

            BidUpdateResult result = redisAuctionService.updateBidWithLock(
                    auction.getId(), bidder1.getId(), price
            );

            if (result.isSuccess()) {
                Thread.sleep(100); // Chờ xử lý
            }
        }

        // Wait for all Kafka events
        Thread.sleep(3000);

        // Then: Ít nhất 1 bid bị FLAGGED do rate limit
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        long flaggedCount = bids.stream()
                .filter(b -> b.getStatus() == BidStatus.FLAGGED)
                .count();

        assertTrue(flaggedCount > 0, "Should have at least 1 FLAGGED bid");

        // Verify fraud log
        List<FraudLog> fraudLogs = fraudLogRepository.findByUserIdOrderByCreatedAtDesc(bidder1.getId());
        assertTrue(fraudLogs.stream().anyMatch(f -> f.getType() == FraudType.RATE_LIMIT));
    }

    // ============================================
    // TEST CASE 6: FRAUD DETECTION - PRICE SPIKE
    // ============================================

    @Test
    @DisplayName("TC6: Phát hiện price spike (>1.5x giá cũ) và gán FLAGGED")
    void shouldFlagPriceSpike() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: spike = 600 (> 1.5x giá cũ)
        BigDecimal spikePrice = new BigDecimal("1600.00");

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), spikePrice
        );

        // Then
        assertTrue(result.isSuccess());

        Thread.sleep(2000);

        // Verify: Bid bị FLAGGED
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        assertEquals(BidStatus.FLAGGED, bids.getFirst().getStatus());

        // Verify fraud log
        List<FraudLog> fraudLogs = fraudLogRepository.findByUserIdOrderByCreatedAtDesc(bidder1.getId());
        assertTrue(fraudLogs.stream().anyMatch(f -> f.getType() == FraudType.PRICE_SPIKE));
    }

    // ============================================
    // TEST CASE 7: BID KHI AUCTION ENDED
    // ============================================

    @Test
    @DisplayName("TC7: Từ chối bid khi auction đã kết thúc")
    void shouldRejectBidWhenAuctionEnded() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: Set auction to ENDED
        auction.setStatus(AuctionStatus.ENDED);
        auctionRepository.save(auction);

        redisAuctionService.updateStatus(auction.getId(), "ENDED");

        // When
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1050.00")
        );

        // Then
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Auction closed"));
    }

    // ============================================
    // TEST CASE 8: BID KHI USER BLOCKED
    // ============================================

    @Test
    @DisplayName("TC8: User bị block (không bid được)")
    void shouldCreateRejectedBidWhenUserBlocked() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: First bid success
        redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1050.00")
        );

        Thread.sleep(1000);

        // Block user
        loginAs(bidder1, UserStatus.BLOCKED);

        // When: Try to bid again
        Thread.sleep(2000);

        assertThrows(
                AppException.class,
                () -> redisAuctionService.updateBidWithLock(auction.getId(), bidder1.getId(), new BigDecimal("1050.00"))
        );
    }

    // ============================================
    // TEST CASE 9: ANTI-SNIPING
    // ============================================

    @Test
    @DisplayName("TC9: Gia hạn auction khi bid trong khoảng anti-snipe")
    void shouldExtendAuctionOnLastMinuteBid() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: Set end time to 30s from now
        Instant originalEndTime = Instant.now().plus(30, ChronoUnit.SECONDS);
        auction.setEndTime(originalEndTime);
        auctionRepository.save(auction);

        redisAuctionService.updateEndTime(auction.getId(), originalEndTime);

        // When: Place bid
        BidUpdateResult result = redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1050.00")
        );

        Thread.sleep(2000);

        // Then: End time should be extended
        Auction updated = auctionRepository.findById(auction.getId()).get();
        assertTrue(updated.getEndTime().isAfter(originalEndTime));

        long extension = Duration.between(originalEndTime, updated.getEndTime()).getSeconds();
        assertEquals(30, extension);
    }

    // ============================================
    // TEST CASE 10: MULTIPLE SEQUENTIAL BIDS
    // ============================================

    @Test
    @DisplayName("TC10: Nhiều bids tuần tự từ các bidders khác nhau")
    void shouldHandleMultipleSequentialBids() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given
        List<BidUpdateResult> results = new ArrayList<>();

        // When: 5 bids tuần tự
        results.add(redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1050.00")
        ));
        Thread.sleep(500);

        loginAs(bidder2, UserStatus.ACTIVE);
        results.add(redisAuctionService.updateBidWithLock(
                auction.getId(), bidder2.getId(), new BigDecimal("1100.00")
        ));
        Thread.sleep(500);

        loginAs(bidder1, UserStatus.ACTIVE);
        results.add(redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1150.00")
        ));
        Thread.sleep(500);

        loginAs(bidder2, UserStatus.ACTIVE);
        results.add(redisAuctionService.updateBidWithLock(
                auction.getId(), bidder2.getId(), new BigDecimal("1200.00")
        ));
        Thread.sleep(500);

        results.add(redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1250.00")
        ));

        // Wait for Kafka
        Thread.sleep(3000);

        // Then: All should succeed
        assertTrue(results.stream().allMatch(BidUpdateResult::isSuccess));

        // Final price should be 1250
        assertEquals(new BigDecimal("1250.00"),
                redisAuctionService.getCurrentPrice(auction.getId()));

        // Should have 5 bid records
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        assertEquals(5, bids.size());

        // All ACCEPTED (no fraud)
        assertEquals(5, bids.stream().filter(b -> b.getStatus() == BidStatus.ACCEPTED).count());
    }

    // ============================================
    // TEST CASE 11: OPTIMISTIC LOCK HANDLING
    // ============================================

    @Test
    @DisplayName("TC11: Xử lý optimistic lock với retry thành công")
    void shouldRetryOnOptimisticLock() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // Given: 10 concurrent bids
        ExecutorService executor = Executors.newFixedThreadPool(10);
        CountDownLatch latch = new CountDownLatch(10);

        // When
        for (int i = 0; i < 10; i++) {
            final int idx = i;
            executor.submit(() -> {
                try {
                    BigDecimal price = new BigDecimal("1000.00")
                            .add(BigDecimal.valueOf((idx + 1) * 60));

                    redisAuctionService.updateBidWithLock(
                            auction.getId(), bidder1.getId(), price
                    );
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        // Wait for all Kafka events
        Thread.sleep(5000);

        // Then: Auction version should be incremented
        Auction updated = auctionRepository.findById(auction.getId()).get();
        assertTrue(updated.getVersion() > 0);

        // Some bids should succeed
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());
        assertTrue(bids.size() > 0);
    }

    // ============================================
    // TEST CASE 12: BID HISTORY AUDIT
    // ============================================

    @Test
    @DisplayName("TC12: Lưu đầy đủ lịch sử bids (ACCEPTED + REJECTED + FLAGGED)")
    void shouldMaintainCompleteBidHistory() throws InterruptedException {
        loginAs(bidder1, UserStatus.ACTIVE);

        // When: Mixed bids
        // 1. Normal bid
        redisAuctionService.updateBidWithLock(
                auction.getId(), bidder1.getId(), new BigDecimal("1050.00")
        );
        Thread.sleep(500);

        // 2. Rejected bid (too low)
        loginAs(bidder1, UserStatus.ACTIVE);
        redisAuctionService.updateBidWithLock(
                auction.getId(), bidder2.getId(), new BigDecimal("1060.00")
        );
        Thread.sleep(500);

        // 3. Self-bidding (FLAGGED)
        redisAuctionService.updateBidWithLock(
                auction.getId(), seller.getId(), new BigDecimal("1100.00")
        );
        Thread.sleep(500);

        // 4. Normal bid
        redisAuctionService.updateBidWithLock(
                auction.getId(), bidder2.getId(), new BigDecimal("1150.00")
        );

        Thread.sleep(3000);

        // Then: Should have all bids in history
        List<Bid> bids = bidRepository.findByAuctionIdOrderByCreatedAtDesc(auction.getId());

        assertTrue(bids.stream().anyMatch(b -> b.getStatus() == BidStatus.ACCEPTED));
        assertTrue(bids.stream().anyMatch(b -> b.getStatus() == BidStatus.FLAGGED));

        // Bidder can see their own bid history
        List<Bid> bidder1Bids = bids.stream()
                .filter(b -> b.getBidder().getId().equals(bidder1.getId()))
                .toList();

        assertFalse(bidder1Bids.isEmpty());
    }
}
