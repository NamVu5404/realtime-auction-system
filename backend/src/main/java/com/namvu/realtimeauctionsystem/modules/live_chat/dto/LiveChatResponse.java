package com.namvu.realtimeauctionsystem.modules.live_chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveChatResponse {
    private Long id;
    private Long auctionId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String senderRole;
    private String content;
    private boolean hidden;
    private Instant createdAt;
}
