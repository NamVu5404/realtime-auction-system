package com.NamVu.realtimeauctionsystem.service;

import com.NamVu.realtimeauctionsystem.dto.user.OutboundUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;

public interface OutboundUserService {
    User onboardUser(OutboundUserResponse userInfo);
}
