package com.namvu.realtimeauctionsystem.modules.bid.scheduler;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaTopic.HEARTBEAT_TOPIC;

@Component
@RequiredArgsConstructor
public class HeartbeatScheduler {

    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedRate = 5000) // Gửi heartbeat mỗi 5 giây
    public void sendHeartbeat() {
        kafkaTemplate.send(HEARTBEAT_TOPIC, "PING");
    }
}
