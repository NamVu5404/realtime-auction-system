package com.namvu.realtimeauctionsystem.modules.contact.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactRequest;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactResponse;
import com.namvu.realtimeauctionsystem.modules.contact.entity.Contact;
import com.namvu.realtimeauctionsystem.modules.contact.mapper.ContactMapper;
import com.namvu.realtimeauctionsystem.modules.contact.repository.ContactRepository;
import com.namvu.realtimeauctionsystem.modules.contact.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final ContactRepository contactRepository;
    private final ContactMapper contactMapper;

    @Override
    @Transactional
    public ContactResponse submitContact(ContactRequest request) {
        Contact contact = contactMapper.mapToEntity(request);
        contact.setProcessed(false);
        return contactMapper.mapToResponse(contactRepository.save(contact));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<ContactResponse> getPendingContacts(Pageable pageable) {
        Page<Contact> page = contactRepository.findByProcessedOrderByCreatedAtDesc(false, pageable);
        return PageResponse.<ContactResponse>builder()
                .data(page.map(contactMapper::mapToResponse).toList())
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<ContactResponse> getProcessedContacts(Pageable pageable) {
        Page<Contact> page = contactRepository.findByProcessedOrderByCreatedAtDesc(true, pageable);
        return PageResponse.<ContactResponse>builder()
                .data(page.map(contactMapper::mapToResponse).toList())
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public ContactResponse markAsProcessed(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CONTACT_NOT_FOUND));
        contact.setProcessed(true);
        return contactMapper.mapToResponse(contactRepository.save(contact));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAuthority('ADMIN')")
    public long countPending() {
        return contactRepository.countByProcessed(false);
    }
}
