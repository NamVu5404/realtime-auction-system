package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.entity.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;

public interface TokenService {
    String generateToken(User user, String type);

    SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException;
}
