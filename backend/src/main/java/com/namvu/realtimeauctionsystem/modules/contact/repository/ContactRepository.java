package com.namvu.realtimeauctionsystem.modules.contact.repository;

import com.namvu.realtimeauctionsystem.modules.contact.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    Page<Contact> findByProcessedOrderByCreatedAtDesc(boolean processed, Pageable pageable);

    long countByProcessed(boolean processed);
}
