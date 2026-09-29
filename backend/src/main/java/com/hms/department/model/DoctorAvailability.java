package com.hms.department.model;

import java.time.LocalTime;
import lombok.Data;

@Data
public class DoctorAvailability {
    private Long id;
    private Long doctorId;
    private int dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean active;
}
