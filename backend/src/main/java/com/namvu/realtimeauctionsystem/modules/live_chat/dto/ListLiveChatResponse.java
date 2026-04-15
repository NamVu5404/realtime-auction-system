package com.namvu.realtimeauctionsystem.modules.live_chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListLiveChatResponse {
    private List<LiveChatResponse> data;
}
