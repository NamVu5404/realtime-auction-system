package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndStatus(String email, String status);

    Optional<User> findByIdAndStatus(Long id, String status);

    boolean existsByEmailAndStatus(String email, UserStatus status);

    boolean existsByIdAndStatus(Long id, UserStatus status);
}
