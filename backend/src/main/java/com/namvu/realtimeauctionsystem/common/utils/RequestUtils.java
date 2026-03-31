package com.namvu.realtimeauctionsystem.common.utils;

import jakarta.servlet.http.HttpServletRequest;

public class RequestUtils {
    private RequestUtils() {
        /* This utility class should not be instantiated */
    }

    public static String getIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null && ip.contains(",") ? ip.split(",")[0].trim() : ip;
    }

    public static String formatVersion(String family, String... parts) {
        if (family == null) return "Unknown";
        StringBuilder sb = new StringBuilder(family);
        boolean first = true;
        for (String part : parts) {
            if (part != null) {
                sb.append(first ? " " : ".").append(part);
                first = false;
            }
        }
        return sb.toString();
    }
}
