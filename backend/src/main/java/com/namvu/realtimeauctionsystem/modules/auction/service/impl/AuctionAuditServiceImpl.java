package com.namvu.realtimeauctionsystem.modules.auction.service.impl;

import com.namvu.realtimeauctionsystem.common.dto.PageResponse;
import com.namvu.realtimeauctionsystem.common.constant.AuctionActionType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auction.dto.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.modules.auction.entity.Auction;
import com.namvu.realtimeauctionsystem.modules.auction.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.modules.auction.mapper.AuctionAuditMapper;
import com.namvu.realtimeauctionsystem.modules.auction.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionAuditService;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionAuditServiceImpl implements AuctionAuditService {

    private final AuctionAuditRepository auctionAuditRepository;
    private final AuctionAuditMapper auctionAuditMapper;
    private final AuctionService auctionService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    public PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable) {
        if (!SecurityUtils.isAdmin()) {
            Auction auction = auctionService.getAuctionDetailById(auctionId);
            Long currentUserId = SecurityUtils.getCurrentUserId();
            if (!auction.getSeller().getId().equals(currentUserId)) {
                throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
            }
        }

        Page<AuctionAudit> auctionAuditPage = auctionAuditRepository
                .findByAuctionIdOrderByCreatedAtDesc(auctionId, pageable);

        List<AuctionAuditResponse> data = auctionAuditPage.stream()
                .map(auctionAuditMapper::mapToResponse)
                .toList();

        return PageResponse.<AuctionAuditResponse>builder()
                .data(data)
                .currentPage(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .totalPage(auctionAuditPage.getTotalPages())
                .totalElements(auctionAuditPage.getTotalElements())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuctionAuditResponse getAuctionResult(Long auctionId) {
        AuctionAudit audit = auctionAuditRepository
                .findFirstByAuctionIdAndActionTypeOrderByCreatedAtDesc(auctionId, AuctionActionType.RESULT)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));

        return auctionAuditMapper.mapToResponse(audit);
    }

    @Override
    public void saveAuctionAudit(AuctionAudit audit) {
        auctionAuditRepository.save(audit);
    }
}
