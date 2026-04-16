package com.namvu.realtimeauctionsystem.modules.live_chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveChatRequest {
    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 200, message = "Message cannot exceed 200 characters")
    private String content;
}
