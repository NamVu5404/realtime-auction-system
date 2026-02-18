package com.NamVu.realtimeauctionsystem.service.impl;

import com.NamVu.realtimeauctionsystem.dto.user.OutboundUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.enums.UserStatus;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.OutboundUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OutboundUserServiceImpl implements OutboundUserService {
    private final UserRepository userRepository;

    @Override
    public User onboardUser(OutboundUserResponse userInfo) {
        boolean isUserBlocked = userRepository.existsByEmailAndStatus(userInfo.getEmail(), UserStatus.BLOCKED);

        if (isUserBlocked) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        return userRepository.findByEmail(userInfo.getEmail()).orElseGet(
                () -> userRepository.save(
                        User.builder()
                                .email(userInfo.getEmail())
                                .name(userInfo.getName())
                                .avatarUrl(userInfo.getPicture())
                                .status(UserStatus.ACTIVE)
                                .build()
                )
        );
    }
}
