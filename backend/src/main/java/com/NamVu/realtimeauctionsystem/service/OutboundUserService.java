package com.namvu.realtimeauctionsystem.service;

import com.namvu.realtimeauctionsystem.dto.user.OutboundUserResponse;
import com.namvu.realtimeauctionsystem.entity.User;

public interface OutboundUserService {
    User onboardUser(OutboundUserResponse userInfo);
}
