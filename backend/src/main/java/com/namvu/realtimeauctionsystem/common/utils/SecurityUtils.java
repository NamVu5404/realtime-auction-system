package com.namvu.realtimeauctionsystem.common.utils;

import com.namvu.realtimeauctionsystem.common.constant.Role;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {

    private SecurityUtils() {
        /* This utility class should not be instantiated */
    }

    public static Long getCurrentUserId() {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return jwt.getClaim("uid");
    }

    public static String getCurrentUserEmail() {
        Jwt jwt = (Jwt) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return jwt.getSubject();
    }

    public static boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.name()));
    }
}
