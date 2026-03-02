package com.namvu.realtimeauctionsystem.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> {
    private int totalPage;
    private int pageSize;
    private int currentPage;
    private long totalElements;

    @Builder.Default
    private List<T> data = Collections.emptyList();
}
