package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.Role;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
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

    Optional<User> findByEmailAndStatus(String email, String status);

    Optional<User> findByIdAndStatus(Long id, String status);

    boolean existsByEmailAndStatus(String email, UserStatus status);

    boolean existsByIdAndStatus(Long id, UserStatus status);

    @Query("""
                SELECT u FROM User u
                WHERE (:status IS NULL OR u.status = :status)
                  AND (:role IS NULL OR u.role = :role)
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
            WHERE u.id = :id AND u.status != :status AND u.role != 'ADMIN'
            """)
    int updateStatus(@Param("id") Long id, @Param("status") UserStatus status, @Param("updatedAt") Instant updatedAt);
}
