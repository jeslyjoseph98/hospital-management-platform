package com.hms.common.security;

public record AuthenticatedPatient(Long patientId, String name, String patientCode) {
}
