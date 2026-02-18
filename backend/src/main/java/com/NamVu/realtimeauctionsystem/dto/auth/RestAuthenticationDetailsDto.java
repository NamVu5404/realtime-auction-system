package com.NamVu.realtimeauctionsystem.dto.auth;

import jakarta.servlet.http.HttpServletRequest;
import ua_parser.Client;
import ua_parser.Parser;

public class RestAuthenticationDetailsDto {
    private static final Parser uaParser = new Parser();

    public static Client getUserAgent(HttpServletRequest request) {
        String userAgentString = request.getHeader("User-Agent");
        if (userAgentString == null || userAgentString.isEmpty()) {
            return null;
        }

        return uaParser.parse(userAgentString);
    }
}
