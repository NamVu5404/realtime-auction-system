package com.namvu.realtimeauctionsystem.modules.ekyc.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class KycResponse {
    private Long userId;
    private String cccdNumber;
    private String name;
    private String dob;
    private String sex;
    private String address;
    private String doe;
    private String frontImageUrl;
    private String backImageUrl;
    private String faceMatchUrl;
    private Instant createdAt;
    private String updatedAt;
}
