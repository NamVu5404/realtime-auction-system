package com.NamVu.realtimeauctionsystem.aop;

import com.NamVu.realtimeauctionsystem.dto.auth.InfoOsDto;
import com.NamVu.realtimeauctionsystem.dto.common.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.auth.AuthenticationResponse;
import com.NamVu.realtimeauctionsystem.dto.user.BlockUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.entity.UserAudit;
import com.NamVu.realtimeauctionsystem.enums.UserActionType;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.UserAuditRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import com.NamVu.realtimeauctionsystem.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
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
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.OutboundAuthenticationController.outboundAuthentication(..))",
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
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.AuthenticationController.logout(..))",
            returning = "response"
    )
    public void afterLogoutReturning(ApiResponse<?> response) {
        if (response.getCode() != 1000) {
            return;
        }

        Jwt jwt = (Jwt) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userId = jwt.getClaim("uid");

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
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.UserController.blockUser(..))",
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
            value = "execution(* com.NamVu.realtimeauctionsystem.controller.UserController.unblockUser(..))",
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
}
