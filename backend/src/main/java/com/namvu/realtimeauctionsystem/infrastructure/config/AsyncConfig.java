package com.namvu.realtimeauctionsystem.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

import static com.namvu.realtimeauctionsystem.common.constant.MessagingConstant.Executor.*;

@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    @Bean(NOTIFICATION_EXECUTOR)
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(500);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("notif-async-");
        executor.setRejectedExecutionHandler((r, exec) ->
                log.warn("[notificationExecutor] Queue full — notification task dropped")
        );
        executor.initialize();
        return executor;
    }

    @Bean(MAIL_EXECUTOR)
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("mail-async-");
        executor.setRejectedExecutionHandler((r, exec) ->
                log.warn("[mailExecutor] Queue full — mail task dropped")
        );
        executor.initialize();
        return executor;
    }

    @Bean(CHAT_EXECUTOR)
    public Executor chatExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(500);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("chat-async-");
        executor.setRejectedExecutionHandler((r, exec) ->
                log.warn("[chatExecutor] Queue full — chat task dropped")
        );
        executor.initialize();
        return executor;
    }
}
