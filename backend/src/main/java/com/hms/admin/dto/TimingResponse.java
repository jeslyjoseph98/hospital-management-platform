package com.hms.admin.dto;

import java.time.LocalTime;

public record TimingResponse(int dayOfWeek, String day, LocalTime startTime, LocalTime endTime) {
}
