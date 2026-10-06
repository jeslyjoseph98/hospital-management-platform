package com.hms.admin.dto;

import java.time.LocalDateTime;

public record AdminDepartmentResponse(
        Long id,
        String deptName,
        String description,
        boolean active,
        int activeDoctorCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
