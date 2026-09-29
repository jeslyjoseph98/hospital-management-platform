package com.hms.department.model;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Doctor {
    private Long id;
    private Long departmentId;
    private String fullName;
    private String qualification;
    private int experienceYears;
    private int dailyLimit;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
