package com.hms.doctor.dto;

/** DRP-R6: name, patient code, age (from date of birth), gender, phone, address. */
public record PatientBrief(
        Long patientId,
        String patientCode,
        String fullName,
        int age,
        String gender,
        String phone,
        String address
) {
}
