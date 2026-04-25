package com.namvu.realtimeauctionsystem.modules.ekyc.controller;

import com.namvu.realtimeauctionsystem.common.dto.ApiResponse;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptFaceMatchResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.KycResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.FACE_MATCH_SUCCESS;
import static com.namvu.realtimeauctionsystem.common.dto.SuccessCode.IDENTITY_VERIFIED;

@RestController
@RequestMapping("/v1/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping(value = "/recognition", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<KycResponse> recognizeKyc(
            @RequestPart("frontImage") MultipartFile frontImage,
            @RequestPart("backImage") MultipartFile backImage
    ) {
        return ApiResponse.of(IDENTITY_VERIFIED, kycService.recognizeKyc(frontImage, backImage));
    }

    @PostMapping(value = "/face-match", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FptFaceMatchResponse.FaceCheckData> faceMatch(
            @RequestPart("selfie") MultipartFile selfie
    ) {
        return ApiResponse.of(FACE_MATCH_SUCCESS, kycService.compareFaces(selfie));
    }

    @GetMapping("/me")
    public ApiResponse<KycResponse> getMyKycInfo() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ApiResponse.ok(kycService.getKycInfo(userId));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<KycResponse> getKycInfo(@PathVariable Long userId) {
        return ApiResponse.ok(kycService.getKycInfo(userId));
    }
}
