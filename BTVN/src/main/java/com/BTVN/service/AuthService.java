package com.BTVN.service;

import com.BTVN.dto.AuthRequest;
import com.BTVN.dto.AuthResponse;
import com.BTVN.entity.User;
import com.BTVN.exception.UnauthorizedException;
import com.BTVN.repository.UserRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void invalidateAllSessionsOnStartup() {
        userRepository.clearAllAuthTokens();
    }

    public AuthResponse register(AuthRequest request) {
        String username = normalizeUsername(request.getUsername());
        String password = validatePassword(request.getPassword());

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username da ton tai");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());
        user.setAuthToken(generateToken());

        User saved = userRepository.save(user);
        return new AuthResponse("Dang ky thanh cong", saved.getAuthToken(), saved.getId(), saved.getUsername());
    }

    public AuthResponse login(AuthRequest request) {
        String username = normalizeUsername(request.getUsername());
        String password = validatePassword(request.getPassword());

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Sai username hoac password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new UnauthorizedException("Sai username hoac password");
        }

        user.setAuthToken(generateToken());
        User saved = userRepository.save(user);
        return new AuthResponse("Dang nhap thanh cong", saved.getAuthToken(), saved.getId(), saved.getUsername());
    }

    public User requireUser(String authHeader) {
        String token = extractBearerToken(authHeader);
        return userRepository.findByAuthToken(token)
                .orElseThrow(() -> new UnauthorizedException("Token khong hop le hoac da het han"));
    }

    public void logout(String authHeader) {
        User user = requireUser(authHeader);
        user.setAuthToken(null);
        userRepository.save(user);
    }

    private String normalizeUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username khong duoc de trong");
        }
        String normalized = username.trim().toLowerCase();
        if (normalized.length() < 3 || normalized.length() > 50) {
            throw new IllegalArgumentException("Username phai tu 3 den 50 ky tu");
        }
        return normalized;
    }

    private String validatePassword(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password khong duoc de trong");
        }
        if (password.length() < 6) {
            throw new IllegalArgumentException("Password toi thieu 6 ky tu");
        }
        return password;
    }

    private String extractBearerToken(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            throw new UnauthorizedException("Thieu Authorization header");
        }
        String prefix = "Bearer ";
        if (!authHeader.startsWith(prefix)) {
            throw new UnauthorizedException("Authorization header phai co dang Bearer <token>");
        }
        String token = authHeader.substring(prefix.length()).trim();
        if (token.isEmpty()) {
            throw new UnauthorizedException("Token khong hop le");
        }
        return token;
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }
}
