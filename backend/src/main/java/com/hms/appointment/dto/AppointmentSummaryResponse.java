package com.hms.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentSummaryResponse(
        Long id,
        String appointmentCode,
        String doctorName,
        String departmentName,
        LocalDate appointmentDate,
        int tokenNumber,
        LocalTime reportingTime,
        String status
) {
}
