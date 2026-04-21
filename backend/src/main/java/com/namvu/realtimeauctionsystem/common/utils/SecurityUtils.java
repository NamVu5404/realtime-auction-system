package com.namvu.realtimeauctionsystem.common.utils;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.Role;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {

    private SecurityUtils() {
        /* This utility class should not be instantiated */
    }

    public static Long getCurrentUserId() {
        try {
            Jwt jwt = (Jwt) SecurityContextHolder
                    .getContext()
                    .getAuthentication()
                    .getPrincipal();
            return jwt.getClaim("uid");
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }

    public static String getCurrentUserEmail() {
        try {
            Jwt jwt = (Jwt) SecurityContextHolder
                    .getContext()
                    .getAuthentication()
                    .getPrincipal();
            return jwt.getSubject();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED_ACTION);
        }

    }

    public static boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(Role.ADMIN.name()));
    }
}
