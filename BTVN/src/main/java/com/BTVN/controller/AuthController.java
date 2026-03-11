package com.BTVN.controller;

import com.BTVN.dto.AuthRequest;
import com.BTVN.dto.AuthResponse;
import com.BTVN.dto.UserInfoResponse;
import com.BTVN.entity.User;
import com.BTVN.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(@RequestHeader("Authorization") String authorization) {
        User user = authService.requireUser(authorization);
        return ResponseEntity.ok(new UserInfoResponse(user.getId(), user.getUsername()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("Authorization") String authorization) {
        authService.logout(authorization);
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", "Dang xuat thanh cong");
        return ResponseEntity.ok(response);
    }
}
