package com.NamVu.realtimeauctionsystem.configuration;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdScalarDeserializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
        return builder -> {
            builder.deserializerByType(String.class, new StdScalarDeserializer<>(String.class) {
                @Override
                public String deserialize(JsonParser parser, DeserializationContext context) throws IOException {
                    String value = parser.getValueAsString();
                    return (value != null) ? value.trim() : null;
                }
            });
        };
    }
}
