package com.namvu.realtimeauctionsystem.modules.user.repository;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.modules.user.dto.CountryStatsProjection;
import com.namvu.realtimeauctionsystem.modules.user.dto.SellerResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.TopSellerProjection;
import com.namvu.realtimeauctionsystem.modules.user.dto.TopBidderPublicProjection;
import com.namvu.realtimeauctionsystem.modules.user.dto.TopSellerPublicProjection;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndStatus(String email, UserStatus status);

    Optional<User> findByIdAndStatus(Long id, UserStatus status);

    boolean existsByEmailAndStatus(String email, UserStatus status);

    @Query("""
                SELECT u FROM User u
                WHERE (:status IS NULL OR u.status = :status)
                  AND (:role IS NULL OR :role MEMBER OF u.roles)
                  AND (:keyword IS NULL
                       OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                       OR LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
                ORDER BY u.createdAt DESC
            """)
    Page<User> findAll(
            @Param("keyword") String keyword,
            @Param("role") Role role,
            @Param("status") UserStatus status,
            Pageable pageable
    );

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("""
            UPDATE User u
            SET u.status = :status, u.updatedAt = :updatedAt
            WHERE u.id = :id AND u.status != :status AND com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role.ADMIN NOT MEMBER OF u.roles
            """)
    void updateStatus(@Param("id") Long id, @Param("status") UserStatus status, @Param("updatedAt") Instant updatedAt);

    @Query("""
            SELECT DISTINCT u.id FROM User u
            WHERE 'ADMIN' MEMBER OF u.roles AND u.status = 'ACTIVE'
            """)
    Set<Long> findAllAdminIds();

    @Query("""
                SELECT
                    u.id AS userId,
                    u.name AS name,
                    u.email AS email,
                    u.phone AS phone,
                    u.avatarUrl AS avatarUrl,
                    u.location AS location,
                    CASE WHEN 'ADMIN' MEMBER OF u.roles THEN true ELSE false END AS isAdmin,
                    (SELECT MAX(sr.approvedAt) FROM SellerRegistration sr WHERE sr.user.id = u.id AND sr.status = 'APPROVED') AS approvedAt,
                    COUNT(a.id) AS totalAuctions,
                    COALESCE(SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END), 0) AS liveAuctions,
                    COALESCE(SUM(CASE WHEN a.status = 'ENDED' THEN 1 ELSE 0 END), 0) AS endedAuctions,
                    COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS totalRevenue
                FROM User u
                JOIN u.roles r
                LEFT JOIN Auction a ON a.seller.id = u.id
                WHERE r = 'SELLER' AND u.status = 'ACTIVE'
                GROUP BY u.id
                ORDER BY u.id DESC
            """)
    Page<SellerResponse> getSellerStatistics(Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r = :role")
    long countByRole(@Param("role") Role role);

    long countByCreatedAtAfter(Instant date);

    long countByStatus(UserStatus status);

    @Query(value = """
                SELECT sub.country, sub.userCount
                FROM (
                    SELECT
                        TRIM(SUBSTRING_INDEX(location, ' - ', -1)) AS country,
                        COUNT(id) AS userCount
                    FROM users
                    WHERE location IS NOT NULL AND location <> ''
                    GROUP BY country
                ) sub
                WHERE sub.country <> ''
                ORDER BY sub.userCount DESC
            """, nativeQuery = true)
    List<CountryStatsProjection> getUsersByCountry();

    @Query("""
                SELECT
                    u.id AS sellerId,
                    u.name AS sellerName,
                    u.email AS sellerEmail,
                    u.avatarUrl AS avatarUrl,
                    COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS totalRevenue,
                    COUNT(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.id ELSE NULL END) AS auctionCount
                FROM User u
                LEFT JOIN Auction a ON a.seller.id = u.id
                WHERE 'SELLER' MEMBER OF u.roles
                GROUP BY u.id
                ORDER BY totalRevenue DESC
            """)
    List<TopSellerProjection> getTopSellers(Pageable pageable);

    @Query("""
                SELECT
                    u.id AS sellerId,
                    u.name AS name,
                    u.avatarUrl AS avatarUrl,
                    u.location AS location,
                    CASE WHEN kv.id IS NOT NULL THEN true ELSE false END AS isVerifiedIdentity,
                    COUNT(a.id) AS totalAuctions,
                    COALESCE(SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END), 0) AS liveAuctions,
                    COUNT(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.id ELSE NULL END) AS soldAuctions
                FROM User u
                JOIN u.roles r
                LEFT JOIN u.kycVerification kv
                LEFT JOIN Auction a ON a.seller.id = u.id
                WHERE r = 'SELLER' AND u.status = 'ACTIVE'
                GROUP BY u.id, u.name, u.avatarUrl, u.location, kv.id
                ORDER BY soldAuctions DESC
            """)
    List<TopSellerPublicProjection> getPublicTopSellers(Pageable pageable);

    @Query(value = """
                SELECT
                    u.id AS id,
                    u.name AS name,
                    u.avatar_url AS avatarUrl,
                    u.location AS location,
                    COUNT(b.id) AS totalBids,
                    COUNT(DISTINCT b.auction_id) AS totalAuctionsParticipated,
                    COUNT(DISTINCT CASE WHEN a.status = 'ENDED' AND a.highest_bidder_id = u.id THEN a.id END) AS totalWins
                FROM users u
                JOIN bids b ON b.bidder_id = u.id
                JOIN auctions a ON a.id = b.auction_id
                WHERE u.status = 'ACTIVE'
                GROUP BY u.id, u.name, u.avatar_url, u.location
                ORDER BY totalWins DESC, totalBids DESC
            """, nativeQuery = true)
    List<TopBidderPublicProjection> getPublicTopBidders(Pageable pageable);
}
