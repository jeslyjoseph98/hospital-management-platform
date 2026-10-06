package com.hms.auth.dto;

public record LoginResponse(String accessToken, long expiresIn, UserSummary user) {
}
