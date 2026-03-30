package com.namvu.realtimeauctionsystem.modules.user.service;

import com.namvu.realtimeauctionsystem.modules.user.dto.OutboundUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;

public interface OutboundUserService {
    User onboardUser(OutboundUserResponse userInfo);
}
