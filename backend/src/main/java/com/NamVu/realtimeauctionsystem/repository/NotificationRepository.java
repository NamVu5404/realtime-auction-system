package com.namvu.realtimeauctionsystem.repository;

import com.namvu.realtimeauctionsystem.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop5ByRecipientIdAndReadOrderByCreatedAtDesc(Long userId, boolean read);

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    int countByRecipientIdAndRead(Long userId, boolean read);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :userId AND n.read = false")
    Integer markAllAsReadForUser(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE Notification n WHERE n.recipient.id = :userId AND n.read = true")
    void deleteAllNotificationsForUser(Long userId);
}
