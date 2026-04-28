package com.namvu.realtimeauctionsystem.modules.ai.controller;

import com.namvu.realtimeauctionsystem.common.constant.AiReviewDecision;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.modules.ai.dto.AiLogCountResponse;
import com.namvu.realtimeauctionsystem.modules.ai.dto.AiLogResponse;
import com.namvu.realtimeauctionsystem.modules.ai.service.AiReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AiReviewController {

    private final AiReviewService aiReviewService;

    @GetMapping("/logs")
    public ApiResponse<PageResponse<AiLogResponse>> getAiLogs(
            @RequestParam(required = false) Long auctionId,
            @RequestParam(required = false) AiReviewDecision decision,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page - 1, size);
        return ApiResponse.ok(aiReviewService.getAiLogs(auctionId, decision, pageable));
    }

    @GetMapping("/logs/counts")
    public ApiResponse<AiLogCountResponse> countAiLogs() {
        return ApiResponse.ok(aiReviewService.countAiLogs());
    }
}
