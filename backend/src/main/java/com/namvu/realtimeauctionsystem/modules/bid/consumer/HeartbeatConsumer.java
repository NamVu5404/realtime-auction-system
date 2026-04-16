package com.namvu.realtimeauctionsystem.modules.bid.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaGroup.HEARTBEAT_MONITOR_GROUP;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaTopic.HEARTBEAT_TOPIC;
import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.WebSocketDestination.HEARTBEAT_TOPIC_PREFIX;

@Component
@RequiredArgsConstructor
@Slf4j
public class HeartbeatConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = HEARTBEAT_TOPIC, groupId = HEARTBEAT_MONITOR_GROUP)
    public void consumeHeartbeat(String message) {
        messagingTemplate.convertAndSend(HEARTBEAT_TOPIC_PREFIX, message);
    }
}
