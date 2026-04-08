package com.namvu.realtimeauctionsystem.modules.user.service;

import com.namvu.realtimeauctionsystem.modules.user.dto.Oauth2UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;

public interface Oauth2UserService {
    User onboardUser(Oauth2UserResponse userInfo);
}
