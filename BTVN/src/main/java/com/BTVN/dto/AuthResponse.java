package com.BTVN.dto;

public class AuthResponse {
    private String message;
    private String token;
    private Long userId;
    private String username;

    public AuthResponse(String message, String token, Long userId, String username) {
        this.message = message;
        this.token = token;
        this.userId = userId;
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }
}
