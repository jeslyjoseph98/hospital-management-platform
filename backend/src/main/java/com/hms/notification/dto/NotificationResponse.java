package com.hms.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        Long appointmentId,
        boolean isRead,
        LocalDateTime createdAt
) {
}
