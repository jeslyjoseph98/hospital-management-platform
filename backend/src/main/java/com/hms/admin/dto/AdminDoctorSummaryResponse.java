package com.hms.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDoctorSummaryResponse(
        Long id,
        String fullName,
        String departmentName,
        String specialization,
        BigDecimal consultationFee,
        int dailyLimit,
        List<String> days,
        boolean active
) {
}
