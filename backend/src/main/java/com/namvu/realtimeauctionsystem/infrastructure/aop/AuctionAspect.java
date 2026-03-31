package com.namvu.realtimeauctionsystem.infrastructure.aop;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.enums.AuctionActionType;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.CancelAuctionResponse;
import com.namvu.realtimeauctionsystem.modules.auction.dto.CreateAuctionRequest;
import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionRepository;
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
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auction.controller.AuctionControllerV1.saveDraft(..))",
            returning = "response"
    )
    public void afterSaveDraftReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        saveAuctionAudit(response, AuctionActionType.CREATED);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auction.controller.AuctionControllerV1.scheduleAuction(..)) && args(request)",
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
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auction.controller.AuctionControllerV1.updateDraftAuction(..)) || " +
                    "execution(* com.namvu.realtimeauctionsystem.modules.auction.controller.AuctionControllerV1.updateScheduledAuction(..))",
            returning = "response"
    )
    public void afterAuctionUpdateReturning(ApiResponse<AuctionResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }
        saveAuctionAudit(response, AuctionActionType.UPDATED);
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auction.controller.AuctionControllerV1.cancelAuction(..))",
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
