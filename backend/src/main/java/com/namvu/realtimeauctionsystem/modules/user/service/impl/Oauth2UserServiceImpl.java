package com.namvu.realtimeauctionsystem.modules.user.service.impl;

import com.namvu.realtimeauctionsystem.common.constant.SecurityConstant.UserStatus;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.RequestUtils;
import com.namvu.realtimeauctionsystem.modules.auth.service.IpLocationService;
import com.namvu.realtimeauctionsystem.modules.mail.service.MailService;
import com.namvu.realtimeauctionsystem.modules.user.dto.Oauth2UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserRepository;
import com.namvu.realtimeauctionsystem.modules.user.service.Oauth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class Oauth2UserServiceImpl implements Oauth2UserService {

    private final UserRepository userRepository;
    private final IpLocationService ipLocationService;
    private final MailService mailService;

    private static final String UNKNOWN_VALUE = "Unknown";

    @Override
    public User onboardUser(Oauth2UserResponse userInfo) {
        boolean isUserBlocked = userRepository.existsByEmailAndStatus(userInfo.getEmail(), UserStatus.BLOCKED);
        if (isUserBlocked) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String ip = UNKNOWN_VALUE;
        String location = UNKNOWN_VALUE;

        if (attributes != null) {
            ip = RequestUtils.getIpAddress(attributes.getRequest());
            location = ipLocationService.getLocationString(ip);
        }

        Optional<User> userOptional = userRepository.findByEmail(userInfo.getEmail());

        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();

            if (existingUser.getPublicIp() == null || UNKNOWN_VALUE.equals(existingUser.getPublicIp())
                    || existingUser.getLocation() == null || UNKNOWN_VALUE.equals(existingUser.getLocation())) {
                existingUser.setPublicIp(ip);
                existingUser.setLocation(location);
                return userRepository.save(existingUser);
            }

            return existingUser;
        }

        User newUser = userRepository.save(
                User.builder()
                        .email(userInfo.getEmail())
                        .name(userInfo.getName())
                        .avatarUrl(userInfo.getPicture())
                        .publicIp(ip)
                        .location(location)
                        .build()
        );

        // Send welcome email
        mailService.sendWelcomeEmail(newUser.getEmail(), newUser.getName());

        return newUser;
    }
}
