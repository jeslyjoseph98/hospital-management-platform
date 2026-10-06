package com.hms.pharmacy.mapper;

import com.hms.pharmacy.dto.PrescriptionListItem;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PharmacyMapper {

    /** PHR-R2: pending list for a date, oldest first. */
    List<PrescriptionListItem> findPending(@Param("date") LocalDate date);

    /** PHR-R3: exact match on patient code / phone / appointment code, last 30 days. */
    List<PrescriptionListItem> search(@Param("q") String q);

    Optional<DetailRow> findDetail(@Param("consultationId") Long consultationId);

    /** PHR-R6: atomic conditional update; 0 rows means someone else already dispensed it. */
    int dispense(@Param("id") Long id, @Param("dispensedBy") Long dispensedBy, @Param("remarks") String remarks);

    record DetailRow(
            Long consultationId,
            String patientName,
            String patientCode,
            int age,
            String gender,
            String doctorName,
            LocalDate consultationDate,
            String diagnosis,
            LocalDate followUpDate,
            String dispenseStatus,
            LocalDateTime dispensedAt,
            String dispensedByName,
            String dispenseRemarks
    ) {
    }
}
