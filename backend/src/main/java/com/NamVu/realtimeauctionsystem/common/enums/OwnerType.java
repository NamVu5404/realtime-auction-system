package com.namvu.realtimeauctionsystem.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum OwnerType {
    AUCTION_IMAGE("auction-image"),
    NEWS("news"),
    HOME_THUMBNAIL("home-thumbnail"),
    USER_AVATAR("avatars");

    private final String folderName;
}
