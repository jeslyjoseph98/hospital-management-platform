package com.hms.admin.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record DoctorBookingsResponse(LocalDate date, int booked, int dailyLimit, List<TokenEntry> tokens) {

    public record TokenEntry(int tokenNumber, String patientName, String patientCode,
                              LocalTime reportingTime, String status) {
    }
}
