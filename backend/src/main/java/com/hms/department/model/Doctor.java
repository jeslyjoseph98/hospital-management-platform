package com.hms.department.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Doctor {
    private Long id;
    private Long userId;
    private Long departmentId;
    private String fullName;
    private String qualification;
    private String specialization;
    private String registrationNumber;
    private int experienceYears;
    private String phone;
    private String email;
    private String about;
    private BigDecimal consultationFee;
    private int dailyLimit;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
