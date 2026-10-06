package com.hms.auth.dto;

public record RegisterResponse(Long userId, String role, String patientCode) {
}
