package com.namvu.realtimeauctionsystem.infrastructure.aop;

import com.namvu.realtimeauctionsystem.common.constant.UserActionType;
import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.auth.dto.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.modules.auth.dto.InfoOsDto;
import com.namvu.realtimeauctionsystem.modules.auth.service.AuthenticationService;
import com.namvu.realtimeauctionsystem.modules.user.dto.BlockUserResponse;
import com.namvu.realtimeauctionsystem.modules.user.dto.UserResponse;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.entity.UserAudit;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserAuditRepository;
import com.namvu.realtimeauctionsystem.modules.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class UserAspect {

    private final UserRepository userRepository;
    private final UserAuditRepository userAuditRepository;
    private final AuthenticationService authenticationService;

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auth.controller.Oauth2AuthenticationController.oauth2Authentication(..))",
            returning = "response"
    )
    public void afterLoginReturning(ApiResponse<AuthenticationResponse> response) {
        if (response.getCode() >= 4000) {
            return;
        }

        Long userId = response.getResult().getUser().getId();

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        InfoOsDto info = authenticationService.getRequestInfo(request);

        log.info("User {} Login from: IP: {}, Location: {}, Browser: {}, OS: {}, Device: {}",
                userId, info.getClientAddress(), info.getLocation(), info.getBrowser(), info.getOs(), info.getDevice());

        Map<String, Object> details = new HashMap<>();
        details.put("IP", info.getClientAddress());
        details.put("Location", info.getLocation());
        details.put("Browser", info.getBrowser());
        details.put("OS", info.getOs());
        details.put("Device", info.getDevice());

        userAuditRepository.save(UserAudit.builder()
                .user(userRepository.getReferenceById(userId))
                .actionType(UserActionType.LOGIN)
                .details(details)
                .build());
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.auth.controller.AuthenticationController.logout(..))",
            returning = "response"
    )
    public void afterLogoutReturning(ApiResponse<?> response) {
        if (response.getCode() >= 4000) {
            return;
        }

        Long userId;

        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return;
        }

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        InfoOsDto info = authenticationService.getRequestInfo(request);

        log.info("User {} Logout from: IP: {}, Location: {}, Browser: {}, OS: {}, Device: {}",
                userId, info.getClientAddress(), info.getLocation(), info.getBrowser(), info.getOs(), info.getDevice());

        Map<String, Object> details = new HashMap<>();
        details.put("IP", info.getClientAddress());
        details.put("Location", info.getLocation());
        details.put("Browser", info.getBrowser());
        details.put("OS", info.getOs());
        details.put("Device", info.getDevice());

        userAuditRepository.save(UserAudit.builder()
                .user(userRepository.getReferenceById(userId))
                .actionType(UserActionType.LOGOUT)
                .details(details)
                .build());
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.user.controller.UserController.blockUser(..))",
            returning = "response"
    )
    public void afterBlockReturning(ApiResponse<BlockUserResponse> response) {
        if (response.getCode() >= 4000) {
            return;
        }

        Long userId = response.getResult().getUserId();
        String blockedBy = response.getResult().getBy();
        String reason = response.getResult().getReason();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Map<String, Object> details = new HashMap<>();
        details.put("user", user.getEmail());
        details.put("by", blockedBy);
        details.put("reason", reason);

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.BLOCKED)
                .details(details)
                .build());
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.user.controller.UserController.unblockUser(..))",
            returning = "response"
    )
    public void afterUnblockReturning(ApiResponse<BlockUserResponse> response) {
        if (response.getCode() >= 4000) {
            return;
        }

        Long userId = response.getResult().getUserId();
        String blockedBy = response.getResult().getBy();
        String reason = response.getResult().getReason();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Map<String, Object> details = new HashMap<>();
        details.put("user", user.getEmail());
        details.put("by", blockedBy);
        details.put("reason", reason);

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.UNBLOCKED)
                .details(details)
                .build());
    }

    @AfterReturning(
            value = "execution(* com.namvu.realtimeauctionsystem.modules.user.controller.UserController.upgradeToSeller(..))",
            returning = "response"
    )
    public void afterUpgradeToSellerReturning(ApiResponse<UserResponse> response) {
        if (response.getCode() >= 4000) {
            return;
        }

        Long userId = response.getResult().getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Map<String, Object> details = new HashMap<>();
        details.put("user", user.getEmail());
        details.put("new_roles", response.getResult().getRoles());

        userAuditRepository.save(UserAudit.builder()
                .user(user)
                .actionType(UserActionType.UPDATED)
                .details(details)
                .build());
    }
}
