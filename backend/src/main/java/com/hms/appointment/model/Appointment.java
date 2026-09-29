package com.hms.appointment.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Data;

@Data
public class Appointment {
    private Long id;
    private String appointmentCode;
    private Long patientId;
    private Long doctorId;
    private LocalDate appointmentDate;
    private int tokenNumber;
    private LocalTime reportingTime;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
