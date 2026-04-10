package com.namvu.realtimeauctionsystem.modules.user.repository;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.modules.user.dto.SellerResponse;
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
                    MAX(sr.approvedAt) AS approvedAt,
                    COUNT(a.id) AS totalAuctions,
                    SUM(CASE WHEN a.status = 'LIVE' THEN 1 ELSE 0 END) AS liveAuctions,
                    SUM(CASE WHEN a.status = 'ENDED' THEN 1 ELSE 0 END) AS endedAuctions,
                    COALESCE(SUM(CASE WHEN a.status = 'ENDED' AND a.highestBidder IS NOT NULL THEN a.currentPrice ELSE 0 END), 0) AS totalRevenue
                FROM User u
                JOIN u.roles r
                LEFT JOIN SellerRegistration sr ON sr.user.id = u.id AND sr.status = 'APPROVED'
                LEFT JOIN Auction a ON a.seller.id = u.id
                WHERE r = 'SELLER' AND u.status = 'ACTIVE'
                GROUP BY u.id
                ORDER BY approvedAt DESC
            """)
    Page<SellerResponse> getSellerStatistics(Pageable pageable);
}
