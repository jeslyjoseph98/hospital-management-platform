package com.hms.doctor.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ConsultationResponse(
        Long id,
        String status,
        String chiefComplaint,
        String symptoms,
        BigDecimal temperatureC,
        Integer pulseBpm,
        Integer bpSystolic,
        Integer bpDiastolic,
        BigDecimal weightKg,
        String diagnosis,
        String doctorNotes,
        String advice,
        LocalDate followUpDate,
        List<PrescriptionItemResponse> prescription
) {
    public record PrescriptionItemResponse(
            String medicineName,
            String strength,
            String dosagePattern,
            String timing,
            int durationDays,
            String instructions
    ) {
    }
}
