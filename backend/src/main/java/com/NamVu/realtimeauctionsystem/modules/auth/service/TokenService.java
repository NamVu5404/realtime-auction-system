package com.namvu.realtimeauctionsystem.modules.auth.service;

import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.common.enums.TokenType;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;

public interface TokenService {
    String generateToken(User user, TokenType type);

    SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException;
}
