package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.TokenType;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;

public interface TokenService {
    String generateToken(User user, TokenType type);

    SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException;
}
