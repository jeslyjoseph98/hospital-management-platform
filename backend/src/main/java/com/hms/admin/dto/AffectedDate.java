package com.hms.admin.dto;

import java.time.LocalDate;

public record AffectedDate(LocalDate date, int booked) {
}
