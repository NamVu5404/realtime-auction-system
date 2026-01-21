package com.NamVu.realtimeauctionsystem.consumer;

import com.NamVu.realtimeauctionsystem.dto.BidFailureMessage;
import com.NamVu.realtimeauctionsystem.dto.BidPlacedEvent;
import com.NamVu.realtimeauctionsystem.service.AuctionDbSyncService;
import com.NamVu.realtimeauctionsystem.service.BiddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class BidEventConsumer {

    private final AuctionDbSyncService dbSyncService;
    private final BiddingService biddingService;
    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(
            topics = "auction.bid.events",
            groupId = "auction-db-sync-group",
            concurrency = "3" // 3 consumer threads
    )
    public void handleBidEvent(BidPlacedEvent event, Acknowledgment ack) {
        log.info("Received bid event: {}", event);

        try {
            log.info("Processing bid event: auction={}, bidder={}", event.getAuctionId(), event.getBidderId());
            dbSyncService.syncBidToDatabase(event);

            // commit khi thành công
            ack.acknowledge();
            log.info("Bid synced successfully: auction={}", event.getAuctionId());
        } catch (Exception e) {
            log.error("DB sync failed for auction {}, sending to DLQ", event.getAuctionId(), e);

            // Tạo bid REJECTED record
            biddingService.createRejectedBidRecord(event);

            // Gửi thông báo lỗi cho bidder qua WebSocket
            notifyBidderFailure(event, e);

            // Vẫn acknowledge để không retry (vì đã lưu REJECTED rồi)
            ack.acknowledge();
        }
    }

    /**
     * Thông báo cho bidder qua WebSocket
     */
    private void notifyBidderFailure(BidPlacedEvent event, Exception error) {
        BidFailureMessage message = BidFailureMessage.builder()
                .auctionId(event.getAuctionId())
                .bidderId(event.getBidderId())
                .amount(event.getAmount())
                .reason(getErrorReason(error))
                .timestamp(Instant.now())
                .build();

        // Gửi đến topic của auction (tất cả người xem thấy)
        messagingTemplate.convertAndSend(
                "/topic/auction/" + event.getAuctionId() + "/bid-failed",
                message
        );

        // Gửi riêng cho bidder
        messagingTemplate.convertAndSendToUser(
                event.getBidderId().toString(),
                "/queue/bid-result",
                message
        );

        log.info("Notified bidder {} about bid failure", event.getBidderId());
    }

    private String getErrorReason(Exception e) {
        if (e.getMessage().contains("not live")) {
            return "Auction has ended";
        }
        if (e.getMessage().contains("Optimistic")) {
            return "Too many concurrent bids, please try again";
        }
        if (e.getMessage().contains("not found")) {
            return "Auction or user not found";
        }
        return "Internal error, please try again";
    }
}
