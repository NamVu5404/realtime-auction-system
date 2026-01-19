package com.NamVu.TeamTaskManager.service;

import com.NamVu.TeamTaskManager.dto.response.auth.OutboundUserResponse;
import com.NamVu.TeamTaskManager.entity.User;

public interface OutboundUserService {
    User onboardUser(OutboundUserResponse userInfo);
}
