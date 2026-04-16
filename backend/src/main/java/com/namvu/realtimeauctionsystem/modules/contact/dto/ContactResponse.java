package com.namvu.realtimeauctionsystem.modules.contact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String subject;
    private String description;
    private boolean processed;
    private Instant createdAt;
    private Instant updatedAt;
    private String updatedBy;
}
