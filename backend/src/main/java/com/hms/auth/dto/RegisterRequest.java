package com.hms.auth.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank String role,
        @NotBlank String fullName,
        @NotBlank String phone,
        String email,
        @NotBlank String password,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String adminCode,
        String registrationNumber,
        String staffCode
) {
}
