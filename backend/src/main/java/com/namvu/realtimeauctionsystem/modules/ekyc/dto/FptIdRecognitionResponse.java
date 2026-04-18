package com.namvu.realtimeauctionsystem.modules.ekyc.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FptIdRecognitionResponse {
    private int errorCode;
    private String errorMessage;
    private List<IdCardData> data;
}
