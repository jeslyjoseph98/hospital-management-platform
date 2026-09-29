package com.hms.department.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record DoctorAvailabilityResponse(
        Long doctorId,
        String doctorName,
        int dailyLimit,
        List<DateAvailability> dates
) {
    public record DateAvailability(
            LocalDate date,
            String day,
            LocalTime startTime,
            LocalTime endTime,
            Integer booked,
            Integer remaining,
            String status
    ) {
    }
}
