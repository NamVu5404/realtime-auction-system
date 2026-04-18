package com.namvu.realtimeauctionsystem.common.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum OwnerType {
    AUCTION_IMAGE("auction-image"),
    NEWS("news"),
    HOME_THUMBNAIL("home-thumbnail"),
    USER_AVATAR("avatars"),
    KYC_FRONT("kyc/front"),
    KYC_BACK("kyc/back"),
    KYC_FACE_MATCH("kyc/face-match"),
    ;

    private final String folderName;
}
