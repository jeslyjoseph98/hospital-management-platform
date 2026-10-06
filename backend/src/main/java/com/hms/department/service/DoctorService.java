package com.hms.department.service;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.department.dto.DoctorAvailabilityResponse;
import com.hms.department.dto.DoctorAvailabilityResponse.DateAvailability;
import com.hms.department.dto.DoctorWithTimingsResponse;
import com.hms.department.dto.DoctorWithTimingsResponse.Timing;
import com.hms.department.mapper.DoctorMapper;
import com.hms.department.model.Doctor;
import com.hms.department.model.DoctorAvailability;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    private static final int BOOKING_WINDOW_DAYS = 7;

    private final DoctorMapper doctorMapper;
    private final DepartmentService departmentService;

    public DoctorService(DoctorMapper doctorMapper, DepartmentService departmentService) {
        this.doctorMapper = doctorMapper;
        this.departmentService = departmentService;
    }

    public List<DoctorWithTimingsResponse> listByDepartment(Long departmentId) {
        departmentService.getActiveOrThrow(departmentId);
        return doctorMapper.findActiveByDepartment(departmentId).stream()
                .map(doctor -> new DoctorWithTimingsResponse(
                        doctor.getId(), doctor.getFullName(), doctor.getQualification(), doctor.getSpecialization(),
                        doctor.getExperienceYears(), doctor.getConsultationFee(), doctor.getAbout(), timings(doctor.getId())))
                .toList();
    }

    /** DOC-R4: doctor not found or inactive -> DOC_NOT_FOUND. */
    public Doctor getActiveOrThrow(Long doctorId) {
        return doctorMapper.findActiveById(doctorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_NOT_FOUND, "Doctor not found"));
    }

    /** spec_details/02 §3: 7-day availability window (today..today+6). */
    public DoctorAvailabilityResponse getAvailability(Long doctorId) {
        Doctor doctor = getActiveOrThrow(doctorId);
        Map<Integer, DoctorAvailability> byDay = doctorMapper.findActiveAvailability(doctorId).stream()
                .collect(java.util.stream.Collectors.toMap(DoctorAvailability::getDayOfWeek, Function.identity()));

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        List<DateAvailability> dates = new java.util.ArrayList<>();
        for (int offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
            LocalDate date = today.plusDays(offset);
            DoctorAvailability availability = byDay.get(date.getDayOfWeek().getValue());
            if (availability == null) {
                dates.add(new DateAvailability(date, dayName(date), null, null, null, null, "NOT_AVAILABLE"));
                continue;
            }

            int booked = doctorMapper.countBookedAppointments(doctorId, date);
            int remaining = doctor.getDailyLimit() - booked;

            String status;
            if (date.isEqual(today) && !now.toLocalTime().isBefore(availability.getEndTime())) {
                status = "CLOSED";
            } else if (remaining <= 0) {
                status = "FULLY_BOOKED";
            } else {
                status = "AVAILABLE";
            }

            dates.add(new DateAvailability(date, dayName(date), availability.getStartTime(),
                    availability.getEndTime(), booked, remaining, status));
        }

        return new DoctorAvailabilityResponse(doctor.getId(), doctor.getFullName(), doctor.getDailyLimit(), dates);
    }

    private List<Timing> timings(Long doctorId) {
        return doctorMapper.findActiveAvailability(doctorId).stream()
                .map(a -> new Timing(DayOfWeek.of(a.getDayOfWeek()).name(), a.getStartTime(), a.getEndTime()))
                .toList();
    }

    private String dayName(LocalDate date) {
        return date.getDayOfWeek().name();
    }
}
