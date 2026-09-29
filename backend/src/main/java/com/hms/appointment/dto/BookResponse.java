package com.hms.appointment.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record BookResponse(
        Long appointmentId,
        String appointmentCode,
        int tokenNumber,
        LocalTime reportingTime,
        LocalDate appointmentDate,
        String doctorName,
        String departmentName,
        String consultationTimings,
        String patientName,
        String patientCode
) {
}
