package com.hms.doctor.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AppointmentDetailResponse(
        Long appointmentId,
        int tokenNumber,
        LocalDate appointmentDate,
        LocalTime reportingTime,
        String reason,
        String status,
        PatientBrief patient,
        ConsultationResponse consultation
) {
}
