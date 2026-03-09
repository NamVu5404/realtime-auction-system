package com.namvu.realtimeauctionsystem.dto.auth;

import jakarta.servlet.http.HttpServletRequest;
import ua_parser.Client;
import ua_parser.Parser;

public class RestAuthenticationDetailsDto {
    private static final Parser uaParser = new Parser();

    private RestAuthenticationDetailsDto() {
        /* This utility class should not be instantiated */
    }

    public static Client getUserAgent(HttpServletRequest request) {
        String userAgentString = request.getHeader("User-Agent");
        if (userAgentString == null || userAgentString.isEmpty()) {
            return null;
        }

        return uaParser.parse(userAgentString);
    }
}
