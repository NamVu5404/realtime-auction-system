package com.NamVu.realtimeauctionsystem.aop;

import com.NamVu.realtimeauctionsystem.dto.response.ApiResponse;
import com.NamVu.realtimeauctionsystem.dto.response.BlockUserResponse;
import com.NamVu.realtimeauctionsystem.entity.User;
import com.NamVu.realtimeauctionsystem.entity.UserAudit;
import com.NamVu.realtimeauctionsystem.enums.UserActionType;
import com.NamVu.realtimeauctionsystem.exception.AppException;
import com.NamVu.realtimeauctionsystem.exception.ErrorCode;
import com.NamVu.realtimeauctionsystem.repository.UserAuditRepository;
import com.NamVu.realtimeauctionsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class UserAspect {

    private final UserRepository userRepository;
    private final UserAuditRepository userAuditRepository;

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
