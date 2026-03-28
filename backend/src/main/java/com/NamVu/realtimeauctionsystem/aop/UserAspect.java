package com.namvu.realtimeauctionsystem.aop;

import com.namvu.realtimeauctionsystem.dto.auth.AuthenticationResponse;
import com.namvu.realtimeauctionsystem.dto.auth.InfoOsDto;
import com.namvu.realtimeauctionsystem.dto.common.ApiResponse;
import com.namvu.realtimeauctionsystem.dto.user.BlockUserResponse;
import com.namvu.realtimeauctionsystem.dto.user.UserResponse;
import com.namvu.realtimeauctionsystem.entity.User;
import com.namvu.realtimeauctionsystem.entity.UserAudit;
import com.namvu.realtimeauctionsystem.enums.UserActionType;
import com.namvu.realtimeauctionsystem.exception.AppException;
import com.namvu.realtimeauctionsystem.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.repository.UserAuditRepository;
import com.namvu.realtimeauctionsystem.repository.UserRepository;
import com.namvu.realtimeauctionsystem.service.AuthenticationService;
import com.namvu.realtimeauctionsystem.utils.SecurityUtils;
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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.OutboundAuthenticationController.outboundAuthentication(..))",
            returning = "response"
    )
    public void afterLoginReturning(ApiResponse<AuthenticationResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Long userId = response.getResult().getUser().getId();

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        InfoOsDto info = authenticationService.getRequestInfo(request);

        log.info("User Login from: IP: {}, Browser: {}, OS: {}, Device: {}",
                info.getClientAddress(), info.getBrowser(), info.getOs(), info.getDevice());

        Map<String, Object> details = new HashMap<>();
        details.put("IP", info.getClientAddress());
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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.AuthenticationController.logout(..))",
            returning = "response"
    )
    public void afterLogoutReturning(ApiResponse<?> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Long userId = SecurityUtils.getCurrentUserId();

        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        InfoOsDto info = authenticationService.getRequestInfo(request);

        log.info("User Logout from: IP: {}, Browser: {}, OS: {}, Device: {}",
                info.getClientAddress(), info.getBrowser(), info.getOs(), info.getDevice());

        Map<String, Object> details = new HashMap<>();
        details.put("IP", info.getClientAddress());
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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.UserController.blockUser(..))",
            returning = "response"
    )
    public void afterBlockReturning(ApiResponse<BlockUserResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Long userId = response.getResult().getUserId();
        String blockedBy = response.getResult().getBy();
        String reason = response.getResult().getReason();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.UserController.unblockUser(..))",
            returning = "response"
    )
    public void afterUnblockReturning(ApiResponse<BlockUserResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Long userId = response.getResult().getUserId();
        String blockedBy = response.getResult().getBy();
        String reason = response.getResult().getReason();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

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
            value = "execution(* com.namvu.realtimeauctionsystem.controller.UserController.upgradeToSeller(..))",
            returning = "response"
    )
    public void afterUpgradeToSellerReturning(ApiResponse<UserResponse> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Long userId = response.getResult().getId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

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
