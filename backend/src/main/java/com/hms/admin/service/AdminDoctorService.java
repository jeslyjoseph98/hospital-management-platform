package com.hms.admin.service;

import com.hms.admin.dto.AdminDoctorResponse;
import com.hms.admin.dto.AdminDoctorSummaryResponse;
import com.hms.admin.dto.AffectedDate;
import com.hms.admin.dto.AffectedDatesPayload;
import com.hms.admin.dto.CreateDoctorRequest;
import com.hms.admin.dto.DoctorBookingsResponse;
import com.hms.admin.dto.ReplaceTimingsRequest;
import com.hms.admin.dto.TimingRequest;
import com.hms.admin.dto.TimingResponse;
import com.hms.admin.dto.UpdateDoctorRequest;
import com.hms.admin.mapper.AdminDoctorMapper;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.common.web.PagedResponse;
import com.hms.department.mapper.DoctorMapper;
import com.hms.department.model.Department;
import com.hms.department.model.Doctor;
import com.hms.department.model.DoctorAvailability;
import com.hms.department.service.DepartmentService;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDoctorService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    private final AdminDoctorMapper adminDoctorMapper;
    private final DoctorMapper doctorMapper;
    private final DepartmentService departmentService;

    public AdminDoctorService(AdminDoctorMapper adminDoctorMapper, DoctorMapper doctorMapper,
                               DepartmentService departmentService) {
        this.adminDoctorMapper = adminDoctorMapper;
        this.doctorMapper = doctorMapper;
        this.departmentService = departmentService;
    }

    public PagedResponse<AdminDoctorSummaryResponse> list(Long departmentId, String name, Boolean active, int page, int size) {
        int offset = page * size;
        List<AdminDoctorSummaryResponse> rows = adminDoctorMapper.findAll(departmentId, name, active, offset, size).stream()
                .map(this::toSummary)
                .toList();
        long total = adminDoctorMapper.countAll(departmentId, name, active);
        return PagedResponse.of(rows, page, size, total);
    }

    public AdminDoctorResponse getById(Long id) {
        Doctor doctor = getDoctorOrThrow(id);
        return toResponse(doctor);
    }

    @Transactional
    public AdminDoctorResponse create(CreateDoctorRequest request, Long adminId) {
        Department department = requireActiveDepartment(request.departmentId());

        if (adminDoctorMapper.existsByRegistrationNumber(request.registrationNumber(), null)) { // DOC-A3
            throw new BusinessException(ErrorCode.ADM_DOCTOR_REG_EXISTS, "A doctor with this registration number already exists");
        }
        int experienceYears = request.experienceYears() == null ? 0 : request.experienceYears();
        int dailyLimit = request.dailyLimit() == null ? 50 : request.dailyLimit(); // DOC-A5
        validateDoctorFields(request.consultationFee(), experienceYears, request.phone(), dailyLimit); // DOC-A4/A5

        List<TimingRequest> timings = request.timings() == null ? List.of() : request.timings();
        validateTimings(timings, dailyLimit);

        Doctor doctor = new Doctor();
        doctor.setDepartmentId(request.departmentId());
        doctor.setFullName(request.fullName());
        doctor.setQualification(request.qualification());
        doctor.setSpecialization(request.specialization());
        doctor.setRegistrationNumber(request.registrationNumber());
        doctor.setExperienceYears(experienceYears);
        doctor.setPhone(request.phone());
        doctor.setEmail(request.email());
        doctor.setAbout(request.about());
        doctor.setConsultationFee(request.consultationFee());
        doctor.setDailyLimit(dailyLimit);
        doctor.setCreatedBy(adminId);
        adminDoctorMapper.insert(doctor); // DOC-A8: doctor + timings in one transaction

        for (TimingRequest timing : timings) {
            insertTiming(doctor.getId(), timing, adminId);
        }

        return toResponse(getDoctorOrThrow(doctor.getId()));
    }

    @Transactional
    public AdminDoctorResponse update(Long id, UpdateDoctorRequest request, Long adminId) {
        Doctor existing = getDoctorOrThrow(id);
        requireActiveDepartment(request.departmentId()); // DOC-A2, DOC-A7: changing department is allowed

        if (adminDoctorMapper.existsByRegistrationNumber(request.registrationNumber(), id)) { // DOC-A3
            throw new BusinessException(ErrorCode.ADM_DOCTOR_REG_EXISTS, "A doctor with this registration number already exists");
        }
        int experienceYears = request.experienceYears() == null ? 0 : request.experienceYears();
        int dailyLimit = request.dailyLimit() == null ? 50 : request.dailyLimit();
        validateDoctorFields(request.consultationFee(), experienceYears, request.phone(), dailyLimit);

        // DOC-A6: reducing daily_limit is blocked if a future date already has more bookings than the new limit.
        List<AffectedDate> overLimit = adminDoctorMapper.findFutureBookedCounts(id).stream()
                .filter(d -> d.booked() > dailyLimit)
                .toList();
        if (!overLimit.isEmpty()) {
            throw new BusinessException(ErrorCode.ADM_LIMIT_BELOW_BOOKED,
                    "New daily limit is below the number of bookings already made on some future dates",
                    new AffectedDatesPayload(overLimit));
        }

        existing.setDepartmentId(request.departmentId());
        existing.setFullName(request.fullName());
        existing.setQualification(request.qualification());
        existing.setSpecialization(request.specialization());
        existing.setRegistrationNumber(request.registrationNumber());
        existing.setExperienceYears(experienceYears);
        existing.setPhone(request.phone());
        existing.setEmail(request.email());
        existing.setAbout(request.about());
        existing.setConsultationFee(request.consultationFee());
        existing.setDailyLimit(dailyLimit);
        existing.setUpdatedBy(adminId);
        adminDoctorMapper.update(existing);

        return toResponse(getDoctorOrThrow(id));
    }

    @Transactional
    public AdminDoctorResponse replaceTimings(Long id, ReplaceTimingsRequest request, Long adminId) {
        Doctor doctor = getDoctorOrThrow(id);
        validateTimings(request.timings(), doctor.getDailyLimit());

        List<DoctorAvailability> current = currentAvailability(id);
        Set<Integer> oldDays = current.stream().map(DoctorAvailability::getDayOfWeek).collect(java.util.stream.Collectors.toSet());
        Set<Integer> newDays = request.timings().stream().map(TimingRequest::dayOfWeek).collect(java.util.stream.Collectors.toSet());

        Set<Integer> removedDays = new HashSet<>(oldDays);
        removedDays.removeAll(newDays); // AVL-R4

        Set<Integer> startTimeChangedDays = new HashSet<>(); // AVL-R5
        for (DoctorAvailability old : current) {
            request.timings().stream()
                    .filter(t -> t.dayOfWeek().equals(old.getDayOfWeek()))
                    .findFirst()
                    .ifPresent(t -> {
                        if (!t.startTime().equals(old.getStartTime())) {
                            startTimeChangedDays.add(old.getDayOfWeek());
                        }
                    });
        }

        Set<Integer> blockedDays = new HashSet<>(removedDays);
        blockedDays.addAll(startTimeChangedDays);

        if (!blockedDays.isEmpty()) {
            List<AffectedDate> affected = adminDoctorMapper.findFutureBookedCounts(id).stream()
                    .filter(d -> blockedDays.contains(d.date().getDayOfWeek().getValue()))
                    .toList();
            if (!affected.isEmpty()) {
                throw new BusinessException(ErrorCode.ADM_DAY_HAS_BOOKINGS,
                        "Some changed or removed days have future bookings", new AffectedDatesPayload(affected));
            }
        }

        adminDoctorMapper.deleteAvailability(id); // AVL-R6
        for (TimingRequest timing : request.timings()) {
            insertTiming(id, timing, adminId);
        }

        return toResponse(getDoctorOrThrow(id));
    }

    @Transactional
    public AdminDoctorResponse updateStatus(Long id, boolean active, Long adminId) {
        getDoctorOrThrow(id);
        if (!active) {
            List<AffectedDate> future = adminDoctorMapper.findFutureBookedCounts(id); // DOC-A9
            if (!future.isEmpty()) {
                throw new BusinessException(ErrorCode.ADM_DOCTOR_HAS_BOOKINGS,
                        "This doctor has future bookings and cannot be deactivated", new AffectedDatesPayload(future));
            }
        }
        adminDoctorMapper.updateStatus(id, active, adminId);
        return toResponse(getDoctorOrThrow(id));
    }

    public DoctorBookingsResponse bookingsForDate(Long id, LocalDate date) {
        Doctor doctor = getDoctorOrThrow(id);
        List<DoctorBookingsResponse.TokenEntry> tokens = adminDoctorMapper.findBookingsForDate(id, date);
        return new DoctorBookingsResponse(date, tokens.size(), doctor.getDailyLimit(), tokens);
    }

    private Department requireActiveDepartment(Long departmentId) {
        Department department = departmentService.getById(departmentId); // 404 if missing
        if (!department.isActive()) { // DOC-A2
            throw new BusinessException(ErrorCode.ADM_DEPARTMENT_INACTIVE, "Department is inactive");
        }
        return department;
    }

    private void validateDoctorFields(BigDecimal consultationFee, int experienceYears, String phone, int dailyLimit) {
        if (consultationFee == null || consultationFee.compareTo(BigDecimal.ZERO) < 0) { // DOC-A4
            throw new BusinessException(ErrorCode.ADM_DOCTOR_INVALID, "Consultation fee must be zero or positive");
        }
        if (experienceYears < 0 || experienceYears > 70) { // DOC-A4
            throw new BusinessException(ErrorCode.ADM_DOCTOR_INVALID, "Experience years must be between 0 and 70");
        }
        if (phone != null && !phone.isBlank() && !PHONE_PATTERN.matcher(phone).matches()) { // DOC-A4
            throw new BusinessException(ErrorCode.ADM_DOCTOR_INVALID, "Phone must be 10 digits starting with 6-9");
        }
        if (dailyLimit < 1 || dailyLimit > 200) { // DOC-A5
            throw new BusinessException(ErrorCode.ADM_DOCTOR_INVALID, "Daily limit must be between 1 and 200");
        }
    }

    private void validateTimings(List<TimingRequest> timings, int dailyLimit) {
        Set<Integer> seenDays = new HashSet<>();
        for (TimingRequest timing : timings) {
            if (!seenDays.add(timing.dayOfWeek())) { // AVL-R1
                throw new BusinessException(ErrorCode.ADM_DUPLICATE_DAY, "Each day can appear at most once");
            }
            if (!timing.endTime().isAfter(timing.startTime())) { // AVL-R2
                throw new BusinessException(ErrorCode.ADM_INVALID_TIME, "End time must be after start time");
            }
            long windowMinutes = Duration.between(timing.startTime(), timing.endTime()).toMinutes();
            if (windowMinutes < dailyLimit) { // AVL-R3
                throw new BusinessException(ErrorCode.ADM_WINDOW_TOO_SHORT,
                        "The consultation window must be at least " + dailyLimit + " minutes long");
            }
        }
    }

    private void insertTiming(Long doctorId, TimingRequest timing, Long adminId) {
        DoctorAvailability availability = new DoctorAvailability();
        availability.setDoctorId(doctorId);
        availability.setDayOfWeek(timing.dayOfWeek());
        availability.setStartTime(timing.startTime());
        availability.setEndTime(timing.endTime());
        availability.setCreatedBy(adminId);
        adminDoctorMapper.insertAvailability(availability);
    }

    private List<DoctorAvailability> currentAvailability(Long doctorId) {
        // Reuses the patient-facing read query; is_active is always 1 for admin-managed rows (AVL-R6 replaces, never soft-deletes).
        return doctorMapper.findActiveAvailability(doctorId);
    }

    private AdminDoctorResponse toResponse(Doctor doctor) {
        Department department = departmentService.getById(doctor.getDepartmentId());
        List<TimingResponse> timings = currentAvailability(doctor.getId()).stream()
                .map(a -> new TimingResponse(a.getDayOfWeek(), DayOfWeek.of(a.getDayOfWeek()).name(), a.getStartTime(), a.getEndTime()))
                .toList();
        return new AdminDoctorResponse(doctor.getId(), doctor.getDepartmentId(), department.getDeptName(),
                doctor.getFullName(), doctor.getQualification(), doctor.getSpecialization(), doctor.getRegistrationNumber(),
                doctor.getExperienceYears(), doctor.getPhone(), doctor.getEmail(), doctor.getAbout(),
                doctor.getConsultationFee(), doctor.getDailyLimit(), doctor.isActive(), timings);
    }

    private AdminDoctorSummaryResponse toSummary(Doctor doctor) {
        Department department = departmentService.getById(doctor.getDepartmentId());
        List<String> days = currentAvailability(doctor.getId()).stream()
                .map(a -> DayOfWeek.of(a.getDayOfWeek()).name().substring(0, 3))
                .toList();
        return new AdminDoctorSummaryResponse(doctor.getId(), doctor.getFullName(), department.getDeptName(),
                doctor.getSpecialization(), doctor.getConsultationFee(), doctor.getDailyLimit(), days, doctor.isActive());
    }

    private Doctor getDoctorOrThrow(Long id) {
        return adminDoctorMapper.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_NOT_FOUND, "Doctor not found"));
    }
}
