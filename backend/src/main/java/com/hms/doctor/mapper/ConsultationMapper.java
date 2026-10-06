package com.hms.doctor.mapper;

import com.hms.doctor.model.Consultation;
import com.hms.doctor.model.PrescriptionItem;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ConsultationMapper {

    Optional<Consultation> findByAppointmentId(@Param("appointmentId") Long appointmentId);

    void insert(Consultation consultation);

    void update(Consultation consultation);

    /** DRP-R15 / spec 07 §3: dispenseStatus is NOT_REQUIRED (no items) or PENDING (1+ items). */
    void complete(@Param("id") Long id, @Param("completedAt") LocalDateTime completedAt,
                  @Param("dispenseStatus") String dispenseStatus);

    List<PrescriptionItem> findItems(@Param("consultationId") Long consultationId);

    void deleteItems(@Param("consultationId") Long consultationId);

    void insertItem(PrescriptionItem item);

    /** DRP-R17: the patient's own completed consultation for one appointment. */
    Optional<PatientConsultationRow> findPatientView(@Param("appointmentId") Long appointmentId);

    /** DRP-R7: the patient's COMPLETED consultations at this hospital, newest first. */
    List<PastVisitRow> findPastVisitsByPatient(@Param("patientId") Long patientId);

    record PatientConsultationRow(
            Long consultationId,
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
            String dispenseStatus,
            LocalDateTime dispensedAt,
            String dispenseRemarks
    ) {
    }

    record PastVisitRow(
            Long consultationId,
            LocalDate date,
            String doctorName,
            String departmentName,
            String diagnosis,
            String advice,
            String doctorNotes,
            String dispenseStatus,
            LocalDateTime dispensedAt,
            String dispenseRemarks
    ) {
    }
}
