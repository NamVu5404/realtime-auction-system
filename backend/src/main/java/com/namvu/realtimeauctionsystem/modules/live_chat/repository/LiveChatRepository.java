package com.namvu.realtimeauctionsystem.modules.live_chat.repository;

import com.namvu.realtimeauctionsystem.modules.live_chat.entity.LiveChat;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LiveChatRepository extends JpaRepository<LiveChat, Long> {
    @EntityGraph(attributePaths = "sender")
    List<LiveChat> findTop50ByAuctionIdAndHiddenOrderByCreatedAtDesc(Long auctionId, boolean hidden);

    List<LiveChat> findByAuctionIdAndSender_IdAndContent(Long auctionId, Long senderId, String content);
}
