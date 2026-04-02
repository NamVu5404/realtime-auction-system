package com.namvu.realtimeauctionsystem.modules.file.repository;

import com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse;
import com.namvu.realtimeauctionsystem.modules.file.entity.File;
import com.namvu.realtimeauctionsystem.common.constant.OwnerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {

    @Modifying
    @Query("UPDATE File f SET f.isPrimary = false WHERE f.ownerType = :type AND f.ownerId = :ownerId")
    void resetPrimaryStatus(OwnerType type, Long ownerId);

    @Query("SELECT new com.namvu.realtimeauctionsystem.modules.file.dto.FileResponse(f.id, f.filePath, f.storageName, f.ownerId, f.sortOrder, f.isPrimary) " +
            "FROM File f " +
            "WHERE f.ownerType = :type AND f.ownerId IN :ids " +
            "ORDER BY f.sortOrder ASC")
    List<FileResponse> findAllByOwnerTypeAndIds(OwnerType type, List<Long> ids); // OwnerType and AuctionIds

    Optional<File> findByOwnerTypeAndOwnerId(OwnerType ownerType, Long ownerId);
}
