package com.NamVu.realtimeauctionsystem.aop;

import com.NamVu.realtimeauctionsystem.dto.auction.AuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.auction.CancelAuctionResponse;
import com.NamVu.realtimeauctionsystem.dto.auction.CreateAuctionRequest;
import com.NamVu.realtimeauctionsystem.dto.common.ApiResponse;
import com.NamVu.realtimeauctionsystem.entity.AuctionAudit;
import com.NamVu.realtimeauctionsystem.enums.AuctionActionType;
import com.NamVu.realtimeauctionsystem.repository.AuctionAuditRepository;
import com.NamVu.realtimeauctionsystem.repository.AuctionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuctionAspect {

    private final AuctionAuditRepository auctionAuditRepository;
    private final AuctionRepository auctionRepository;
    private final ObjectMapper objectMapper;

    @AfterReturning(
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuctionControllerV1.saveDraft(..))",
            returning = "response"
    )
    public void afterSaveDraftReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.CREATED);
    }

    @AfterReturning(
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuctionControllerV1.scheduleAuction(..)) && args(request)",
            returning = "response"
    )
    public void afterScheduleAuctionReturning(CreateAuctionRequest request, ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        AuctionActionType type = request.getId() == null ? AuctionActionType.CREATED : AuctionActionType.UPDATED;

        saveAuctionAudit(response, type);
    }

    @AfterReturning(
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuctionControllerV1.updateDraftAuction(..))",
            returning = "response"
    )
    public void afterUpdateDraftAuctionReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.UPDATED);
    }

    @AfterReturning(
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuctionControllerV1.updateScheduledAuction(..))",
            returning = "response"
    )
    public void afterUpdateScheduledAuctionReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.UPDATED);
    }

    @AfterReturning(
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuctionControllerV1.cancelAuction(..))",
            returning = "response"
    )
    public void afterCancelAuctionReturning(ApiResponse<CancelAuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Map<String, Object> details = objectMapper.convertValue(response.getResult(), new TypeReference<>() {
        });

        auctionAuditRepository.save(AuctionAudit.builder()
                .auction(auctionRepository.getReferenceById(response.getResult().getAuctionId()))
                .actionType(AuctionActionType.CANCELLED)
                .details(details)
                .build());
    }

    private void saveAuctionAudit(ApiResponse<AuctionResponse> response, AuctionActionType type) {
        Map<String, Object> details = objectMapper.convertValue(response.getResult(), new TypeReference<>() {
        });

        auctionAuditRepository.save(AuctionAudit.builder()
                .auction(auctionRepository.getReferenceById(response.getResult().getId()))
                .actionType(type)
                .details(details)
                .build());
    }
}
