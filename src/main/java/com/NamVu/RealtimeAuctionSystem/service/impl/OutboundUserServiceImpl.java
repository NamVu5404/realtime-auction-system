package com.NamVu.TeamTaskManager.service.impl;

import com.NamVu.TeamTaskManager.dto.response.auth.OutboundUserResponse;
import com.NamVu.TeamTaskManager.entity.User;
import com.NamVu.TeamTaskManager.repository.UserRepository;
import com.NamVu.TeamTaskManager.service.OutboundUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OutboundUserServiceImpl implements OutboundUserService {
    private final UserRepository userRepository;

    @Override
    public User onboardUser(OutboundUserResponse userInfo) {
        return userRepository.findByUsername(userInfo.getEmail()).orElseGet(
                () -> userRepository.save(
                        User.builder()
                                .username(userInfo.getEmail())
                                .fullName(userInfo.getName())
                                .isActive((byte) 1)
                                .build()
                )
        );
    }
}
