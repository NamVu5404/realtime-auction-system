package com.namvu.realtimeauctionsystem.aop;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.dto.auction.AuctionResponse;
import com.namvu.realtimeauctionsystem.dto.auction.CancelAuctionResponse;
import com.namvu.realtimeauctionsystem.dto.auction.CreateAuctionRequest;
import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.enums.AuctionActionType;
import com.namvu.realtimeauctionsystem.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuctionControllerV1.saveDraft(..))",
            returning = "response"
    )
    public void afterSaveDraftReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.CREATED);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuctionControllerV1.scheduleAuction(..)) && args(request)",
            returning = "response",
            argNames = "request,response")
    public void afterScheduleAuctionReturning(CreateAuctionRequest request, ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        AuctionActionType type = request.getId() == null ? AuctionActionType.CREATED : AuctionActionType.UPDATED;

        saveAuctionAudit(response, type);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuctionControllerV1.updateDraftAuction(..))",
            returning = "response"
    )
    public void afterUpdateDraftAuctionReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.UPDATED);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuctionControllerV1.updateScheduledAuction(..))",
            returning = "response"
    )
    public void afterUpdateScheduledAuctionReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.UPDATED);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuctionControllerV1.cancelAuction(..))",
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
