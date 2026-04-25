package com.namvu.realtimeauctionsystem.modules.ekyc.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;
import com.namvu.realtimeauctionsystem.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "kyc_verifications")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class KycVerification extends Auditable {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String cccdNumber;
    private String name;
    private String dob;
    private String sex;
    private String address;
    private String doe;

    private String frontImageUrl;
    private String backImageUrl;
    private String faceMatchUrl;
}
