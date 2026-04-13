package com.namvu.realtimeauctionsystem.modules.contact.service;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactRequest;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactResponse;
import org.springframework.data.domain.Pageable;

public interface ContactService {
    ContactResponse submitContact(ContactRequest request);

    PageResponse<ContactResponse> getPendingContacts(Pageable pageable);

    PageResponse<ContactResponse> getProcessedContacts(Pageable pageable);

    ContactResponse markAsProcessed(Long id);

    long countPending();
}
