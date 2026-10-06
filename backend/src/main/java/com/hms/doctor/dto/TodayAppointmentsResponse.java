package com.hms.doctor.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record TodayAppointmentsResponse(
        LocalDate date,
        int total,
        int completed,
        int pending,
        List<AppointmentItem> appointments
) {
    public record AppointmentItem(
            Long appointmentId,
            int tokenNumber,
            LocalTime reportingTime,
            Long patientId,
            String patientName,
            String patientCode,
            int age,
            String gender,
            String status
    ) {
    }
}
