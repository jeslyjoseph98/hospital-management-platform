package com.hms.pharmacy.dto;

import com.hms.doctor.dto.ConsultationResponse.PrescriptionItemResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PrescriptionDetailResponse(
        Long consultationId,
        PatientMini patient,
        String doctorName,
        LocalDate consultationDate,
        String diagnosis,
        List<PrescriptionItemResponse> items,
        LocalDate followUpDate,
        String dispenseStatus,
        LocalDateTime dispensedAt,
        String dispensedByName,
        String dispenseRemarks
) {
    /** PHR-R4: name, code, age, gender only — no phone/address, no doctor_notes or vitals. */
    public record PatientMini(String name, String patientCode, int age, String gender) {
    }
}
