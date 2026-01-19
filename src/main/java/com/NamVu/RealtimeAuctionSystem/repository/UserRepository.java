package com.NamVu.TeamTaskManager.repository;

import com.NamVu.TeamTaskManager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameAndIsActive(String username, byte status);

    Optional<User> findByIdAndIsActive(String id, byte status);

    boolean existsByUsername(String username);
}
