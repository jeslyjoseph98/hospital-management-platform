package com.hms.patient.dto;

import java.time.LocalDate;

public record PatientProfileResponse(
        Long id,
        String patientCode,
        String fullName,
        LocalDate dateOfBirth,
        String gender,
        String phone,
        String email,
        String address
) {
}
