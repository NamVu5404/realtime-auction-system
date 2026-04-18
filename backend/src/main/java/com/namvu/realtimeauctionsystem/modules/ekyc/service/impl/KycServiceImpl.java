package com.namvu.realtimeauctionsystem.modules.ekyc.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import com.namvu.realtimeauctionsystem.common.exception.AppException;
import com.namvu.realtimeauctionsystem.common.exception.ErrorCode;
import com.namvu.realtimeauctionsystem.common.utils.SecurityUtils;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.FptFaceMatchClient;
import com.namvu.realtimeauctionsystem.infrastructure.http_clients.FptIdRecognitionClient;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptFaceMatchResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptIdRecognitionResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.IdCardData;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.KycResponse;
import com.namvu.realtimeauctionsystem.modules.ekyc.entity.KycVerification;
import com.namvu.realtimeauctionsystem.modules.ekyc.mapper.KycMapper;
import com.namvu.realtimeauctionsystem.modules.ekyc.repository.KycVerificationRepository;
import com.namvu.realtimeauctionsystem.modules.ekyc.service.KycService;
import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.file.service.FileService;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import com.namvu.realtimeauctionsystem.modules.user.service.UserService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.multipart.MultipartFile;
import reactor.util.annotation.NonNull;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycServiceImpl implements KycService {

    @Value("${app.fpt.api-key}")
    private String apiKey;

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    private final FptIdRecognitionClient fptIdRecognitionClient;
    private final FptFaceMatchClient fptFaceMatchClient;
    private final FileService fileService;
    private final KycVerificationRepository kycRepository;
    private final UserService userService;
    private final KycMapper kycMapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public KycResponse recognizeKyc(MultipartFile frontImage, MultipartFile backImage) {
        Long userId = SecurityUtils.getCurrentUserId();

        FptIdRecognitionResponse response;
        try {
            response = fptIdRecognitionClient.recognizeId(apiKey, frontImage);
        } catch (FeignException e) {
            log.error("FPT API call failed: {}", e.getMessage());
            try {
                String body = e.contentUTF8();
                FptIdRecognitionResponse errorResponse = objectMapper.readValue(body, FptIdRecognitionResponse.class);
                handleFptError(errorResponse);
            } catch (JsonProcessingException ex) {
                log.error("Failed to parse FPT error response: {}", ex.getMessage());
                throw new AppException(ErrorCode.FPT_API_ERROR_1);
            }
            throw new AppException(ErrorCode.FPT_API_ERROR_1);
        }

        IdCardData idCardData = response.getData().getFirst();

        if (kycRepository.existsByCccdNumber(idCardData.getId())) {
            throw new AppException(ErrorCode.CCCD_ALREADY_EXISTS);
        }

        FileResponse frontImageResponse = fileService.uploadFile(frontImage, OwnerType.KYC_FRONT, userId, null, null);
        FileResponse backImageResponse = fileService.uploadFile(backImage, OwnerType.KYC_BACK, userId, null, null);

        KycVerification kyc = KycVerification.builder()
                .user(userService.getUserReference(userId))
                .cccdNumber(idCardData.getId())
                .name(idCardData.getName())
                .dob(idCardData.getDob())
                .sex(idCardData.getSex())
                .address(idCardData.getAddress())
                .doe(idCardData.getDoe())
                .frontImageUrl(frontImageResponse.storageName())
                .backImageUrl(backImageResponse.storageName())
                .build();
        kyc = kycRepository.save(kyc);

        return buildResponse(kyc);
    }

    @Override
    @Transactional
    public FptFaceMatchResponse.FaceCheckData compareFaces(MultipartFile selfie) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userService.getActiveUserById(userId);

        if (user.isFaceMatch()) {
            throw new AppException(ErrorCode.FACE_MATCH_ALREADY_VERIFIED);
        }

        KycVerification kyc = kycRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND));

        String relativePath = OwnerType.KYC_FRONT.getFolderName();
        Path frontImagePath = Paths.get(uploadDir).resolve(relativePath).resolve(kyc.getFrontImageUrl());

        if (!Files.exists(frontImagePath)) {
            throw new AppException(ErrorCode.FILE_NOT_FOUND);
        }
        Resource frontImageResource = new FileSystemResource(frontImagePath);

        FptFaceMatchResponse response;
        try {
            MultipartFile[] filesToMatch = new MultipartFile[]{
                    selfie,
                    new ResourceMultipartFile(frontImageResource)
            };
            response = fptFaceMatchClient.matchFaces(apiKey, filesToMatch);
        } catch (FeignException e) {
            log.error("FPT Face Match API call failed: {}", e.getMessage());
            try {
                String body = e.contentUTF8();
                FptFaceMatchResponse matchResponse = objectMapper.readValue(body, FptFaceMatchResponse.class);
                handleFptError(matchResponse);
            } catch (JsonProcessingException ex) {
                log.error("Failed to parse FPT face match error response: {}", ex.getMessage());
                throw new AppException(ErrorCode.FPT_API_ERROR_1);
            }
            throw new AppException(ErrorCode.FPT_API_ERROR_1);
        }

        try {
            FptFaceMatchResponse.FaceCheckData result = objectMapper.treeToValue(response.getData(), FptFaceMatchResponse.FaceCheckData.class);

            if (!result.isMatch()) {
                throw new AppException(ErrorCode.FACE_MATCH_FAILED);
            }

            if (result.isBothImgIDCard()) {
                throw new AppException(ErrorCode.INVALID_SELFIE_PHOTO);
            }

            user.setFaceMatch(true);
            userService.saveUser(user);

            FileResponse fileResponse = fileService.uploadFile(selfie, OwnerType.KYC_FACE_MATCH, userId, null, null);
            kyc.setFaceMatchUrl(fileResponse.storageName());
            kycRepository.save(kyc);

            return result;

        } catch (JsonProcessingException e) {
            log.error("Failed to parse face match data: {}", e.getMessage());
            throw new AppException(ErrorCode.FPT_API_ERROR_1);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public KycResponse getKycInfo(Long userId) {
        KycVerification kyc = kycRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.KYC_NOT_FOUND));
        return buildResponse(kyc);
    }

    private void handleFptError(FptIdRecognitionResponse response) {
        switch (response.getErrorCode()) {
            case 0 -> {
                // success
            }
            case 1 -> throw new AppException(ErrorCode.FPT_API_ERROR_1);
            case 2 -> throw new AppException(ErrorCode.FPT_API_ERROR_2);
            case 3 -> throw new AppException(ErrorCode.FPT_API_ERROR_3);
            case 5 -> throw new AppException(ErrorCode.FPT_API_ERROR_5);
            case 6 -> throw new AppException(ErrorCode.FPT_API_ERROR_6);
            case 7 -> throw new AppException(ErrorCode.FPT_API_ERROR_7);
            case 8 -> throw new AppException(ErrorCode.FPT_API_ERROR_8);
            case 9 -> throw new AppException(ErrorCode.FPT_API_ERROR_9);
            case 10 -> throw new AppException(ErrorCode.FPT_API_ERROR_10);
            default -> throw new AppException(ErrorCode.FPT_NO_DATA);
        }
    }

    private void handleFptError(FptFaceMatchResponse response) {
        switch (response.getCode()) {
            case "200" -> {
                // success
            }
            case "407" -> throw new AppException(ErrorCode.FPT_RESPONSE_CODE_407);
            case "408" -> throw new AppException(ErrorCode.FPT_RESPONSE_CODE_408);
            case "409" -> throw new AppException(ErrorCode.FPT_RESPONSE_CODE_409);
            default -> throw new AppException(ErrorCode.FPT_NO_DATA);
        }
    }

    private KycResponse buildResponse(KycVerification kyc) {
        KycResponse response = kycMapper.mapToResponse(kyc);
        response.setFrontImageUrl(OwnerType.KYC_FRONT.getFolderName() + "/" + kyc.getFrontImageUrl());
        response.setBackImageUrl(OwnerType.KYC_BACK.getFolderName() + "/" + kyc.getBackImageUrl());
        response.setFaceMatchUrl(OwnerType.KYC_FACE_MATCH.getFolderName() + "/" + kyc.getFaceMatchUrl());
        return response;
    }

    private record ResourceMultipartFile(Resource resource) implements MultipartFile {
        @Override
        @NonNull
        public String getName() {
            return "file[]";
        }

        @Override
        public String getOriginalFilename() {
            return resource.getFilename();
        }

        @Override
        public String getContentType() {
            try {
                String contentType = Files.probeContentType(Paths.get(resource.getURI()));
                return contentType != null ? contentType : "application/octet-stream";
            } catch (Exception e) {
                return "application/octet-stream";
            }
        }

        @Override
        public boolean isEmpty() {
            try {
                return resource.contentLength() == 0;
            } catch (Exception e) {
                return false;
            }
        }

        @Override
        public long getSize() {
            try {
                return resource.contentLength();
            } catch (Exception e) {
                return 0;
            }
        }

        @Override
        @NonNull
        public byte[] getBytes() throws IOException {
            return FileCopyUtils.copyToByteArray(resource.getInputStream());
        }

        @Override
        @NonNull
        public InputStream getInputStream() throws IOException {
            return resource.getInputStream();
        }

        @Override
        public void transferTo(@NonNull File dest) throws IOException, IllegalStateException {
            FileCopyUtils.copy(resource.getFile(), dest);
        }
    }
}
