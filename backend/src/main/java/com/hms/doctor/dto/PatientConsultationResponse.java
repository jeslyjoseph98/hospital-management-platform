package com.hms.doctor.dto;

import com.hms.doctor.dto.ConsultationResponse.PrescriptionItemResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DRP-R17: patient view of their own completed consultation. doctor_notes is never included.
 * PHR-R9: dispenseStatus/dispensedAt/dispenseRemarks drive "Medicines given on {date}" vs
 * "Medicines not yet collected" (NOT_REQUIRED means no prescription was written).
 */
public record PatientConsultationResponse(
        LocalDate date,
        String doctorName,
        String diagnosis,
        String advice,
        LocalDate followUpDate,
        BigDecimal temperatureC,
        Integer pulseBpm,
        Integer bpSystolic,
        Integer bpDiastolic,
        BigDecimal weightKg,
        List<PrescriptionItemResponse> prescription,
        String dispenseStatus,
        LocalDateTime dispensedAt,
        String dispenseRemarks
) {
}
