package com.namvu.realtimeauctionsystem.modules.ekyc.service;

import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptFaceMatchResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.KycResponse;
import org.springframework.web.multipart.MultipartFile;

public interface KycService {
    KycResponse recognizeKyc(MultipartFile frontImage, MultipartFile backImage);

    FptFaceMatchResponse.FaceCheckData compareFaces(MultipartFile selfie);

    KycResponse getKycInfo(Long userId);
}
