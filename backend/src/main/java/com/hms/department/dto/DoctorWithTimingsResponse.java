package com.hms.department.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record DoctorWithTimingsResponse(
        Long id,
        String fullName,
        String qualification,
        String specialization,
        int experienceYears,
        BigDecimal consultationFee,
        String about,
        List<Timing> timings
) {
    public record Timing(String day, LocalTime startTime, LocalTime endTime) {
    }
}
