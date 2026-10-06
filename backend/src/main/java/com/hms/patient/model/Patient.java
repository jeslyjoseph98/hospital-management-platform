package com.hms.patient.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Patient {
    private Long id;
    private Long userId;
    private String patientCode;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
