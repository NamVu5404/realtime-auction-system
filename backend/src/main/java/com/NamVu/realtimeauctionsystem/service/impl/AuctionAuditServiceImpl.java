package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.entity.Auction;
import com.namvu.realtimeauctionsystem.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.mapper.AuctionAuditMapper;
import com.namvu.realtimeauctionsystem.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.repository.AuctionRepository;
import com.namvu.realtimeauctionsystem.service.AuctionAuditService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuctionAuditServiceImpl implements AuctionAuditService {

    private final AuctionAuditRepository auctionAuditRepository;
    private final AuctionAuditMapper auctionAuditMapper;
    private final AuctionRepository auctionRepository;

    @Override
    @PreAuthorize("hasAnyAuthority('ADMIN', 'SELLER')")
    public PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable) {
        if (!SecurityUtils.isAdmin()) {
            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new AppException(ErrorCode.AUCTION_NOT_FOUND));
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
}
