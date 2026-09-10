package com.example.bidverse.Dto;


public record AuthResponse(Long userId, String name, String email, String role, String accessToken, java.time.Instant expiresAt) {
    public AuthResponse(Long userId, String name, String email, String role) { this(userId, name, email, role, null, null); }
}
