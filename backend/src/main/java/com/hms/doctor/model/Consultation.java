package com.hms.doctor.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Consultation {
    private Long id;
    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private String chiefComplaint;
    private String symptoms;
    private BigDecimal temperatureC;
    private Integer pulseBpm;
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private BigDecimal weightKg;
    private String diagnosis;
    private String doctorNotes;
    private String advice;
    private LocalDate followUpDate;
    private String status;
    private LocalDateTime completedAt;
    private String dispenseStatus;
    private Long dispensedBy;
    private LocalDateTime dispensedAt;
    private String dispenseRemarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
