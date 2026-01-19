package com.NamVu.TeamTaskManager.repository;

import com.NamVu.TeamTaskManager.entity.InvalidatedToken;
import com.NamVu.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, String> {

}
