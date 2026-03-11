package com.BTVN.dto;

public class UserInfoResponse {
    private Long id;
    private String username;

    public UserInfoResponse(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }
}
