package com.namvu.realtimeauctionsystem.modules.notification.mapper;

import com.namvu.realtimeauctionsystem.modules.notification.dto.NotificationResponse;
import com.namvu.realtimeauctionsystem.modules.notification.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "recipient.id", target = "userId")
    @Mapping(source = "type.title", target = "title")
    NotificationResponse mapToResponse(Notification notification);
}
