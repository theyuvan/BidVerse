package com.example.bidverse.Security;

public record AuthenticatedUser(Long userId, String role, String email) {

    public boolean hasRole(String expected) {
        return role != null && role.equalsIgnoreCase(expected);
    }
}
