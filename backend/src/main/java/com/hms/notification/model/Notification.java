package com.hms.notification.model;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Notification {
    private Long id;
    private Long patientId;
    private String title;
    private String message;
    private Long appointmentId;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
