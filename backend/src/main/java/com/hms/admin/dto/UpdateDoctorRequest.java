package com.hms.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateDoctorRequest(
        @NotNull Long departmentId,
        @NotBlank String fullName,
        @NotBlank String qualification,
        @NotBlank String specialization,
        @NotBlank String registrationNumber,
        Integer experienceYears,
        String phone,
        String email,
        String about,
        @NotNull BigDecimal consultationFee,
        Integer dailyLimit
) {
}
