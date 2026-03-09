package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.Role;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
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

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndStatus(String email, UserStatus status);

    Optional<User> findByIdAndStatus(Long id, UserStatus status);

    boolean existsByEmailAndStatus(String email, UserStatus status);

    boolean existsByIdAndStatus(Long id, UserStatus status);

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
            WHERE u.id = :id AND u.status != :status AND com.namvu.realtimeauctionsystem.enums.Role.ADMIN NOT MEMBER OF u.roles
            """)
    void updateStatus(@Param("id") Long id, @Param("status") UserStatus status, @Param("updatedAt") Instant updatedAt);
}
