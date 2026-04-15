package com.namvu.realtimeauctionsystem.modules.live_chat.service;

import com.namvu.realtimeauctionsystem.modules.live_chat.dto.ListLiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatRequest;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.entity.LiveChat;

public interface LiveChatService {
    void validateAndBroadcast(Long auctionId, LiveChatRequest request, Long senderId);

    void saveAsync(LiveChat message);

    ListLiveChatResponse getLiveChatHistory(Long auctionId);

    LiveChatResponse hiddenMessage(Long auctionId, Long senderId, String content);

    void banChat(Long userId, int minutes);

    void unbanChat(Long userId);
}
