package com.namvu.realtimeauctionsystem.modules.live_chat.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.CacheNameConstant;
import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.auction.service.AuctionService;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.ListLiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatRequest;
import com.namvu.realtimeauctionsystem.modules.live_chat.dto.LiveChatResponse;
import com.namvu.realtimeauctionsystem.modules.live_chat.entity.LiveChat;
import com.namvu.realtimeauctionsystem.modules.live_chat.repository.LiveChatRepository;
import com.namvu.realtimeauctionsystem.modules.live_chat.service.LiveChatService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationContext;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.Executor.CHAT_EXECUTOR;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.CHAT_TOPIC_PREFIX;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveChatServiceImpl implements LiveChatService {

    private final LiveChatRepository liveChatRepository;
    private final UserService userService;
    private final AuctionService auctionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationContext applicationContext;
    private final CacheManager cacheManager;
    private final RedisTemplate<String, Object> redisTemplate;

    private LiveChatService self() {
        return applicationContext.getBean(LiveChatService.class);
    }

    @Override
    public void validateAndBroadcast(Long auctionId, LiveChatRequest request, Long senderId) {
        auctionService.isLiveAuction(auctionId);

        User sender = userService.getActiveUserById(senderId);
        if (sender.isBanned()) {
            throw new AppException(ErrorCode.BANNED_CHAT);
        }

        String key = CacheNameConstant.CHAT_RATE_LIMIT_PREFIX + senderId + ":" + auctionId;
        Boolean isFirst = redisTemplate.opsForValue().setIfAbsent(key, "1", 2, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(isFirst)) {
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }

        LiveChatResponse response = buildResponse(auctionId, sender, request);
        messagingTemplate.convertAndSend(CHAT_TOPIC_PREFIX + auctionId, response);

        self().saveAsync(LiveChat.builder()
                .auctionId(auctionId)
                .sender(sender)
                .content(request.getContent())
                .hidden(false)
                .build());
    }

    @Async(CHAT_EXECUTOR)
    @Override
    @CacheEvict(value = CacheNameConstant.LIVECHAT, key = "#message.getAuctionId()")
    public void saveAsync(LiveChat message) {
        liveChatRepository.save(message);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheNameConstant.LIVECHAT, key = "#auctionId")
    public ListLiveChatResponse getLiveChatHistory(Long auctionId) {
        List<LiveChat> liveChats = liveChatRepository.findTop50ByAuctionIdAndHiddenOrderByCreatedAtDesc(auctionId, Boolean.FALSE);
        return ListLiveChatResponse.builder()
                .data(liveChats.stream().map(this::buildResponse).toList())
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize("hasAuthority('ADMIN')")
    public LiveChatResponse hiddenMessage(Long auctionId, Long senderId, String content) {
        List<LiveChat> messages = liveChatRepository.findByAuctionIdAndSender_IdAndContent(auctionId, senderId, content);

        if (messages.isEmpty()) {
            throw new AppException(ErrorCode.MESSAGE_NOT_FOUND);
        }

        messages.forEach(m -> m.setHidden(true));
        liveChatRepository.saveAll(messages);

        Cache cache = cacheManager.getCache(CacheNameConstant.LIVECHAT);
        if (cache != null) {
            cache.evict(auctionId);
        }

        LiveChatResponse response = buildResponse(messages.getFirst());
        messagingTemplate.convertAndSend(CHAT_TOPIC_PREFIX + auctionId, response);

        return response;
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public void banChat(Long userId, int minutes) {
        userService.banUserFromChat(userId, minutes);
    }

    @Override
    @PreAuthorize("hasAuthority('ADMIN')")
    public void unbanChat(Long userId) {
        userService.unbanUserFromChat(userId);
    }

    private LiveChatResponse buildResponse(Long auctionId, User sender, LiveChatRequest request) {
        return LiveChatResponse.builder()
                .auctionId(auctionId)
                .senderId(sender.getId())
                .senderName(sender.getName())
                .senderAvatar(sender.getAvatarUrl())
                .senderRole(buildRole(sender.getRoles()))
                .content(request.getContent())
                .build();
    }

    private LiveChatResponse buildResponse(LiveChat liveChat) {
        return LiveChatResponse.builder()
                .id(liveChat.getId())
                .auctionId(liveChat.getAuctionId())
                .senderId(liveChat.getSender().getId())
                .senderName(liveChat.getSender().getName())
                .senderAvatar(liveChat.getSender().getAvatarUrl())
                .senderRole(buildRole(liveChat.getSender().getRoles()))
                .content(liveChat.getContent())
                .hidden(liveChat.isHidden())
                .createdAt(liveChat.getCreatedAt())
                .build();
    }

    private String buildRole(Set<Role> roles) {
        if (roles.contains(Role.ADMIN)) {
            return Role.ADMIN.name();
        } else if (roles.contains(Role.SELLER)) {
            return Role.SELLER.name();
        } else {
            return Role.USER.name();
        }
    }
}
