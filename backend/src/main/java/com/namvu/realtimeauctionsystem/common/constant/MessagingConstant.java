package com.namvu.realtimeauctionsystem.common.constant;

public class MessagingConstant {
    private MessagingConstant() {
        /* This utility class should not be instantiated */
    }

    public static final class KafkaTopic {
        private KafkaTopic() {
            /* This utility class should not be instantiated */
        }

        public static final String BID_EVENTS_TOPIC = "bid-events";
        public static final String HEARTBEAT_TOPIC  = "heartbeat";
    }

    public static final class KafkaGroup {
        private KafkaGroup() {
            /* This utility class should not be instantiated */
        }

        public static final String BID_PROCESSOR_GROUP = "auction-bid-sync-group";
        public static final String HEARTBEAT_MONITOR_GROUP = "monitor-heartbeat-group";
    }

    public static final class WebSocketDestination {
        private WebSocketDestination() {
            /* This utility class should not be instantiated */
        }

        public static final String AUCTION_TOPIC_PREFIX = "/topic/auction/";
        public static final String NOTIFICATION_TOPIC_PREFIX = "/topic/notifications/";
        public static final String HEARTBEAT_TOPIC_PREFIX = "/topic/heartbeat";
        public static final String CHAT_TOPIC_PREFIX = "/topic/chat/";
        public static final String ERRORS_TOPIC_PREFIX = "/topic/errors";
    }

    public static final class Executor {
        private Executor() {
            /* This utility class should not be instantiated */
        }

        public static final String NOTIFICATION_EXECUTOR = "notificationExecutor";
        public static final String MAIL_EXECUTOR = "mailExecutor";
        public static final String CHAT_EXECUTOR = "chatExecutor";
    }
}
