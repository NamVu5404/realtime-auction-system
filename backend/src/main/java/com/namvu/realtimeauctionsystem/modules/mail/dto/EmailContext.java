package com.namvu.realtimeauctionsystem.modules.mail.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
public class EmailContext {
    private String to;
    private String subject;
    private String template;
    private Map<String, Object> variables;
}
