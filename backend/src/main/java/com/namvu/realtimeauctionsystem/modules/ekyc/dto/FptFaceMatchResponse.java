package com.namvu.realtimeauctionsystem.modules.ekyc.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FptFaceMatchResponse {
    private String code;
    private JsonNode data;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FaceCheckData {
        @JsonProperty("isMatch")
        private boolean match;
        
        private double similarity;
        
        @JsonProperty("isBothImgIDCard")
        private boolean bothImgIDCard;
    }
}
