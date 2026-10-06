package com.hms.doctor.dto;

import com.hms.doctor.dto.ConsultationResponse.PrescriptionItemResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PatientDetailResponse(
        PatientBrief patient,
        List<PastVisit> pastVisits
) {
    /** DRP-R7: doctor_notes of other doctors' visits are also shown (shared hospital record). */
    public record PastVisit(
            LocalDate date,
            String doctorName,
            String departmentName,
            String diagnosis,
            String advice,
            String doctorNotes,
            List<PrescriptionItemResponse> prescription,
            String dispenseStatus,
            LocalDateTime dispensedAt,
            String dispenseRemarks
    ) {
    }
}
