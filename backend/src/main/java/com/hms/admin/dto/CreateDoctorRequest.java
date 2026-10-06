package com.hms.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record CreateDoctorRequest(
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
        Integer dailyLimit,
        @Valid List<TimingRequest> timings
) {
}
