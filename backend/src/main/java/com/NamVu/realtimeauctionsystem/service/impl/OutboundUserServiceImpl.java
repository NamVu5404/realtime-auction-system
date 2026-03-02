package com.namvu.realtimeauctionsystem.service.impl;

import com.namvu.realtimeauctionsystem.dto.user.OutboundUserResponse;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.enums.UserStatus;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.OutboundUserService;
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
