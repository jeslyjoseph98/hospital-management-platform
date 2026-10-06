package com.hms.doctor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SaveConsultationRequest(
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
        @Valid List<PrescriptionItemRequest> prescription
) {
    public record PrescriptionItemRequest(
            @NotBlank String medicineName,
            String strength,
            @NotBlank String dosagePattern,
            @NotBlank String timing,
            int durationDays,
            String instructions
    ) {
    }
}
