package com.hms.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String role, @NotBlank String phone, @NotBlank String password) {
}
