package com.BTVN.repository;

import com.BTVN.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findAllByOwnerIdOrderByUploadTimeDesc(Long ownerId);
    Optional<FileMetadata> findByIdAndOwnerId(Long id, Long ownerId);
}
