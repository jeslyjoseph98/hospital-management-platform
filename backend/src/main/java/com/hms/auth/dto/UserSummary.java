package com.hms.auth.dto;

public record UserSummary(Long id, String name, String role, Long patientId, String patientCode, Long doctorId) {
}
