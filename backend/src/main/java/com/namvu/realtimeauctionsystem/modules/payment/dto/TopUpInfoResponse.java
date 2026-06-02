package com.namvu.realtimeauctionsystem.modules.payment.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopUpInfoResponse {
    private String transferCode;
    private String bankName;
    private String accountNumber;
    private String accountHolder;
    private String transferNote;
}
