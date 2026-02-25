package com.NamVu.realtimeauctionsystem.entity;

import com.NamVu.realtimeauctionsystem.enums.OwnerType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "file", indexes = {
        @Index(name = "idx_file_owner", columnList = "owner_type, owner_id, sort_order")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class File extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
