package com.namvu.realtimeauctionsystem.common.constant;

public final class SecurityConstant {

    public enum TokenType {
        ACCESS_TOKEN,
        REFRESH_TOKEN
    }

    public enum UserStatus {
        ACTIVE,
        BLOCKED
    }

    public enum Role {
        USER,
        SELLER,
        ADMIN
    }
}
