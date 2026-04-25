package com.namvu.realtimeauctionsystem.infrastructure.http_clients;

import com.namvu.realtimeauctionsystem.infrastructure.config.FeignConfig;
import com.namvu.realtimeauctionsystem.modules.ekyc.dto.FptFaceMatchResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "fpt-face-match", url = "${app.fpt.face-match-url}", configuration = FeignConfig.class)
public interface FptFaceMatchClient {
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FptFaceMatchResponse matchFaces(
            @RequestHeader("api_key") String apiKey,
            @RequestPart("file[]") MultipartFile[] files
    );
}
