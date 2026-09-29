package com.hms.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record BookRequest(@NotNull Long doctorId, @NotNull LocalDate appointmentDate, String reason) {
}
