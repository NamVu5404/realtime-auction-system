package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.auction.AuctionAuditResponse;
import com.namvu.realtimeauctionsystem.dto.common.PageResponse;
import com.namvu.realtimeauctionsystem.entity.AuctionAudit;
import com.namvu.realtimeauctionsystem.mapper.AuctionAuditMapper;
import com.namvu.realtimeauctionsystem.repository.AuctionAuditRepository;
import com.namvu.realtimeauctionsystem.service.AuctionAuditService;
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

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public PageResponse<AuctionAuditResponse> getAuctionAudit(Long auctionId, Pageable pageable) {
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
