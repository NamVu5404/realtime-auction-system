package com.namvu.realtimeauctionsystem.modules.file.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadataRequest {
    private Long id;

    @JsonProperty("isPrimary")
    private Boolean isPrimary;

    private Integer sortOrder;
}
