package com.namvu.realtimeauctionsystem.infrastructure.config;

import com.namvu.realtimeauctionsystem.modules.bid.dto.BidPlacedEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.KafkaTopic.BID_EVENTS_TOPIC;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, BidPlacedEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, BidPlacedEvent> consumerFactory) {

        ConcurrentKafkaListenerContainerFactory<String, BidPlacedEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }

    @Bean
    public NewTopic bidEventsTopic() {
        return TopicBuilder.name(BID_EVENTS_TOPIC)
                .partitions(6)
                .replicas(3)
                .build();
    }
}
