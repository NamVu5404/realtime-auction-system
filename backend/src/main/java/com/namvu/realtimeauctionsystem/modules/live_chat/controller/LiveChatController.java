package com.namvu.realtimeauctionsystem.modules.live_chat.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.ListLiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatRequest;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.service.LiveChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.*;

@RestController
@RequestMapping("/v1/live-chat")
@RequiredArgsConstructor
@Slf4j
public class LiveChatController {

    private final LiveChatService liveChatService;

    @MessageMapping("/auction/{auctionId}")
    public void handleChatMessage(@DestinationVariable Long auctionId,
                                  @Payload @Valid LiveChatRequest request,
                                  Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Long userId = jwt.getClaim("uid");
        liveChatService.validateAndBroadcast(auctionId, request, userId);
    }

    @GetMapping("/auctions/{auctionId}/history")
    public ApiResponse<ListLiveChatResponse> getLiveChatHistory(@PathVariable Long auctionId) {
        return ApiResponse.ok(liveChatService.getLiveChatHistory(auctionId));
    }

    @PatchMapping("/hidden")
    public ApiResponse<LiveChatResponse> hiddenMessage(
            @RequestParam Long auctionId,
            @RequestParam Long senderId,
            @RequestParam String content
    ) {
        return ApiResponse.of(HIDDEN_MESSAGE, liveChatService.hiddenMessage(auctionId, senderId, content));
    }

    @PatchMapping("/users/{userId}/ban")
    public ApiResponse<Void> banChat(@PathVariable Long userId, @RequestParam int minutes) {
        liveChatService.banChat(userId, minutes);
        return ApiResponse.of(BANNED_USER, null);
    }

    @PatchMapping("/users/{userId}/unban")
    public ApiResponse<Void> unbanChat(@PathVariable Long userId) {
        liveChatService.unbanChat(userId);
        return ApiResponse.of(UNBANNED_USER, null);
    }
}
