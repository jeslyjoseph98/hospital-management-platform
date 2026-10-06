package com.hms.pharmacy.dto;

import java.time.LocalDateTime;

public record PrescriptionListItem(
        Long consultationId,
        String appointmentCode,
        int tokenNumber,
        String patientName,
        String patientCode,
        String doctorName,
        String departmentName,
        LocalDateTime completedAt,
        int itemCount,
        String dispenseStatus
) {
}
