package com.hms.patient.dto;

public record LoginResponse(String accessToken, long expiresIn, PatientSummary patient) {

    public record PatientSummary(Long id, String patientCode, String name) {
    }
}
