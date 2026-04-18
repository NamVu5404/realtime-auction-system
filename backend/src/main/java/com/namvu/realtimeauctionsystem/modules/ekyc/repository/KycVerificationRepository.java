package com.namvu.realtimeauctionsystem.modules.ekyc.repository;

import com.namvu.realtimeauctionsystem.modules.ekyc.entity.KycVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KycVerificationRepository extends JpaRepository<KycVerification, Long> {
    boolean existsByCccdNumber(String cccdNumber);

    Optional<KycVerification> findByUserId(Long userId);
}
