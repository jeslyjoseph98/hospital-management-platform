package com.hms.department.model;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Department {
    private Long id;
    private String deptName;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
