package com.namvu.realtimeauctionsystem.infrastructure.http_clients;

import com.namvu.realtimeauctionsystem.infrastructure.config.FeignConfig;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptIdRecognitionResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "fpt-id-recognition", url = "${app.fpt.id-recognition-url}", configuration = FeignConfig.class)
public interface FptIdRecognitionClient {
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FptIdRecognitionResponse recognizeId(
            @RequestHeader("api-key") String apiKey,
            @RequestPart("image") MultipartFile image
    );
}
