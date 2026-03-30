package com.namvu.realtimeauctionsystem.modules.file.entity;

import com.namvu.realtimeauctionsystem.common.entity.Auditable;

import com.namvu.realtimeauctionsystem.common.enums.OwnerType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "file", indexes = {
        @Index(name = "idx_file_owner", columnList = "owner_type, owner_id, sort_order")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class File extends Auditable {

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false, unique = true)
    private String storageName;

    @Column(nullable = false)
    private String filePath;

    private String contentType;

    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OwnerType ownerType;

    @Column(nullable = false)
    private Long ownerId;

    private Integer sortOrder;

    private boolean isPrimary;
}
