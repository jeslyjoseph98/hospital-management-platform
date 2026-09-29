package com.hms.department.dto;

import java.time.LocalTime;
import java.util.List;

public record DoctorWithTimingsResponse(
        Long id,
        String fullName,
        String qualification,
        int experienceYears,
        List<Timing> timings
) {
    public record Timing(String day, LocalTime startTime, LocalTime endTime) {
    }
}
