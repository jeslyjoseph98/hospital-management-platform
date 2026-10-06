package com.hms.common.security;

/**
 * JWT principal shared by every role. {@code id} is {@code users.id} (the JWT {@code sub}).
 * {@code patientId} / {@code patientCode} are only set when {@code role == PATIENT}.
 * {@code doctorId} is only set when {@code role == DOCTOR}.
 */
public record AuthenticatedUser(Long id, String role, String name, Long patientId, String patientCode, Long doctorId) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isPatient() {
        return "PATIENT".equals(role);
    }

    public boolean isDoctor() {
        return "DOCTOR".equals(role);
    }

    public boolean isPharmacist() {
        return "PHARMACIST".equals(role);
    }
}
