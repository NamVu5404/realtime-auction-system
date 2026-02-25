package com.NamVu.realtimeauctionsystem.repository;

import com.NamVu.realtimeauctionsystem.dto.file.FileResponse;
import com.NamVu.realtimeauctionsystem.entity.File;
import com.NamVu.realtimeauctionsystem.enums.OwnerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {

    @Modifying
    @Query("UPDATE File f SET f.isPrimary = false WHERE f.ownerType = :type AND f.ownerId = :ownerId")
    void resetPrimaryStatus(OwnerType type, Long ownerId);

    @Query("SELECT new com.NamVu.realtimeauctionsystem.dto.file.FileResponse(f.id, f.filePath, f.storageName, f.ownerId, f.sortOrder, f.isPrimary) " +
            "FROM File f " +
            "WHERE f.ownerType = :type AND f.ownerId IN :ids " +
            "ORDER BY f.sortOrder ASC")
    List<FileResponse> findAllByOwnerTypeAndIds(OwnerType type, List<Long> ids);
}
