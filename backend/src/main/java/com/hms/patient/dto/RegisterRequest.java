package com.hms.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank String firstName,
        String lastName,
        @NotNull LocalDate dateOfBirth,
        @NotBlank String gender,
        @NotBlank String phone,
        String email,
        @NotBlank String password,
        String address
) {
}
