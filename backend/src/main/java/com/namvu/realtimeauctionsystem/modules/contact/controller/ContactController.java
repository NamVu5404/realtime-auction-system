package com.namvu.realtimeauctionsystem.modules.contact.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactRequest;
import com.namvu.realtimeauctionsystem.modules.contact.dto.ContactResponse;
import com.namvu.realtimeauctionsystem.modules.contact.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.CONTACT_PROCESSED;
import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.CONTACT_SUBMITTED;

@RestController
@RequestMapping("/v1/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ApiResponse<ContactResponse> submitContact(@RequestBody @Valid ContactRequest request) {
        return ApiResponse.of(CONTACT_SUBMITTED, contactService.submitContact(request));
    }

    @GetMapping("/pending")
    public ApiResponse<PageResponse<ContactResponse>> getPendingContacts(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(contactService.getPendingContacts(pageable));
    }

    @GetMapping("/processed")
    public ApiResponse<PageResponse<ContactResponse>> getProcessedContacts(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(contactService.getProcessedContacts(pageable));
    }

    @PatchMapping("/{id}/process")
    public ApiResponse<ContactResponse> markAsProcessed(@PathVariable Long id) {
        return ApiResponse.of(CONTACT_PROCESSED, contactService.markAsProcessed(id));
    }
}
