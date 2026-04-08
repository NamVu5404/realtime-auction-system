package com.namvu.realtimeauctionsystem.modules.user.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.modules.user.dto.Oauth2UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserRepository;
import com.namvu.realtimeauctionsystem.modules.user.service.Oauth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class Oauth2UserServiceImpl implements Oauth2UserService {
    private final UserRepository userRepository;

    @Override
    public User onboardUser(Oauth2UserResponse userInfo) {
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
