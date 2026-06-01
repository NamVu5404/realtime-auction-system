package com.namvu.realtimeauctionsystem.modules.wallet.service.impl;

import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import com.namvu.realtimeauctionsystem.modules.wallet.dto.WalletResponse;
import com.namvu.realtimeauctionsystem.modules.wallet.entity.Wallet;
import com.namvu.realtimeauctionsystem.modules.wallet.repository.WalletRepository;
import com.namvu.realtimeauctionsystem.modules.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final UserService userService;

    @Override
    @Transactional
    public Wallet getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            User user = userService.getUserReference(userId);
            Wallet wallet = Wallet.builder()
                    .user(user)
                    .availableBalance(BigDecimal.ZERO)
                    .lockedBalance(BigDecimal.ZERO)
                    .build();
            return walletRepository.save(wallet);
        });
    }

    @Override
    @Transactional
    public void lockFunds(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.INSUFFICIENT_BALANCE));
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        wallet.setLockedBalance(wallet.getLockedBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void releaseFunds(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(amount));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void deductLockedFunds(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(amount));
        walletRepository.save(wallet);
    }

    @Override
    @Transactional
    public void creditFunds(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    User user = userService.getUserReference(userId);
                    return Wallet.builder()
                            .user(user)
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .build();
                });
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        walletRepository.save(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAvailableBalance(Long userId) {
        return walletRepository.findByUserId(userId)
                .map(Wallet::getAvailableBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public WalletResponse getWalletInfo(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId).orElseGet(() -> {
            User user = userService.getUserReference(userId);
            Wallet w = Wallet.builder()
                    .user(user)
                    .availableBalance(BigDecimal.ZERO)
                    .lockedBalance(BigDecimal.ZERO)
                    .build();
            return walletRepository.save(w);
        });

        return WalletResponse.builder()
                .userId(userId)
                .availableBalance(wallet.getAvailableBalance())
                .lockedBalance(wallet.getLockedBalance())
                .totalBalance(wallet.getAvailableBalance().add(wallet.getLockedBalance()))
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
