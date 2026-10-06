package com.hms.doctor.model;

import lombok.Data;

@Data
public class PrescriptionItem {
    private Long id;
    private Long consultationId;
    private String medicineName;
    private String strength;
    private String dosagePattern;
    private String timing;
    private int durationDays;
    private String instructions;
    private int displayOrder;
}
