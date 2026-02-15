package com.NamVu.realtimeauctionsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfoOsDto {
    private String clientAddress;
    private String browser;
    private String os;
    private String device;
}
