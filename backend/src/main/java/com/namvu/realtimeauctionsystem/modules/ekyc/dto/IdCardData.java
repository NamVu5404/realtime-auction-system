package com.namvu.realtimeauctionsystem.modules.ekyc.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class IdCardData {
    private String id;          // Số CCCD
    private String name;        // Họ tên
    private String dob;         // Ngày sinh
    private String sex;         // Giới tính
    private String address;     // Địa chỉ
    private String doe;         // Ngày hết hạn
}
