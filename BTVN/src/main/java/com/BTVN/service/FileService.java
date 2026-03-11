package com.BTVN.service;

import com.BTVN.entity.FileMetadata;
import com.BTVN.entity.User;
import com.BTVN.exception.FileNotFoundException;
import com.BTVN.repository.FileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final Path uploadPath;

    public FileService(FileRepository fileRepository,
                       @Value("${file.upload-dir}") String uploadDir) throws IOException {
        this.fileRepository = fileRepository;
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadPath);
    }

    public FileMetadata uploadFile(MultipartFile file, User owner) throws IOException {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" + originalFilename;
        Path targetPath = this.uploadPath.resolve(storedName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        FileMetadata metadata = new FileMetadata();
        metadata.setOriginalName(originalFilename);
        metadata.setStoredName(storedName);
        metadata.setFileType(file.getContentType());
        metadata.setFileSize(file.getSize());
        metadata.setFilePath(targetPath.toString());
        metadata.setUploadTime(LocalDateTime.now());
        metadata.setOwner(owner);

        return fileRepository.save(metadata);
    }

    public List<FileMetadata> getAllFiles(User owner) {
        return fileRepository.findAllByOwnerIdOrderByUploadTimeDesc(owner.getId());
    }

    public FileMetadata getFileById(Long id, User owner) {
        return fileRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new FileNotFoundException("Khong tim thay file voi id = " + id));
    }

    public Resource downloadFile(Long id, User owner) throws MalformedURLException {
        FileMetadata metadata = getFileById(id, owner);

        Path path = Paths.get(metadata.getFilePath());
        if (!Files.exists(path)) {
            throw new FileNotFoundException("File vat ly khong ton tai tren server");
        }

        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new FileNotFoundException("Khong the doc file");
        }

        return resource;
    }

    public void deleteFile(Long id, User owner) throws IOException {
        FileMetadata metadata = getFileById(id, owner);

        Path path = Paths.get(metadata.getFilePath());
        Files.deleteIfExists(path);
        fileRepository.delete(metadata);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File khong duoc de trong");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new IllegalArgumentException("Ten file khong hop le");
        }
    }
}
