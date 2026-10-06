package com.hms.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDoctorResponse(
        Long id,
        Long departmentId,
        String departmentName,
        String fullName,
        String qualification,
        String specialization,
        String registrationNumber,
        int experienceYears,
        String phone,
        String email,
        String about,
        BigDecimal consultationFee,
        int dailyLimit,
        boolean active,
        List<TimingResponse> timings
) {
}
