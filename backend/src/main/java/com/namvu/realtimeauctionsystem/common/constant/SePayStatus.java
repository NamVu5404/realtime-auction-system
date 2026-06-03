package com.namvu.realtimeauctionsystem.common.constant;

public enum SePayStatus {
    CREDITED,  // code matched user → wallet credited
    IGNORED,   // transferType="out", no user match, or duplicate
    FAILED     // unexpected error during processing
}
