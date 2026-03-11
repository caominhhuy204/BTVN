package com.BTVN.controller;

import com.BTVN.entity.FileMetadata;
import com.BTVN.entity.User;
import com.BTVN.service.AuthService;
import com.BTVN.service.FileService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Content-Disposition")
public class FileController {

    private final FileService fileService;
    private final AuthService authService;

    public FileController(FileService fileService, AuthService authService) {
        this.fileService = fileService;
        this.authService = authService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestHeader("Authorization") String authorization,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        User user = authService.requireUser(authorization);
        FileMetadata savedFile = fileService.uploadFile(file, user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Upload file thanh cong");
        response.put("data", savedFile);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FileMetadata>> getAllFiles(@RequestHeader("Authorization") String authorization) {
        User user = authService.requireUser(authorization);
        return ResponseEntity.ok(fileService.getAllFiles(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileMetadata> getFileById(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id
    ) {
        User user = authService.requireUser(authorization);
        return ResponseEntity.ok(fileService.getFileById(id, user));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id
    ) throws IOException {
        User user = authService.requireUser(authorization);
        FileMetadata metadata = fileService.getFileById(id, user);
        Resource resource = fileService.downloadFile(id, user);

        String contentType = Files.probeContentType(Paths.get(metadata.getFilePath()));
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + metadata.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFile(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long id
    ) throws IOException {
        User user = authService.requireUser(authorization);
        fileService.deleteFile(id, user);

        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "Xoa file thanh cong");

        return ResponseEntity.ok(response);
    }
}
