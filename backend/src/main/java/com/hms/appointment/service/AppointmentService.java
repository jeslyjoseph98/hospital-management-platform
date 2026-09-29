package com.hms.appointment.service;

import com.hms.appointment.dto.AppointmentSummaryResponse;
import com.hms.appointment.dto.BookRequest;
import com.hms.appointment.dto.BookResponse;
import com.hms.appointment.mapper.AppointmentMapper;
import com.hms.appointment.model.Appointment;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.department.mapper.DoctorMapper;
import com.hms.department.model.Department;
import com.hms.department.model.Doctor;
import com.hms.department.model.DoctorAvailability;
import com.hms.department.service.DepartmentService;
import com.hms.department.service.DoctorService;
import com.hms.notification.service.NotificationService;
import com.hms.patient.mapper.PatientMapper;
import com.hms.patient.model.Patient;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private final AppointmentMapper appointmentMapper;
    private final DoctorMapper doctorMapper;
    private final DoctorService doctorService;
    private final DepartmentService departmentService;
    private final PatientMapper patientMapper;
    private final NotificationService notificationService;

    public AppointmentService(AppointmentMapper appointmentMapper, DoctorMapper doctorMapper,
                               DoctorService doctorService, DepartmentService departmentService,
                               PatientMapper patientMapper, NotificationService notificationService) {
        this.appointmentMapper = appointmentMapper;
        this.doctorMapper = doctorMapper;
        this.doctorService = doctorService;
        this.departmentService = departmentService;
        this.patientMapper = patientMapper;
        this.notificationService = notificationService;
    }

    /**
     * READ_COMMITTED: under the default REPEATABLE READ, the plain COUNT(*) below would reuse the
     * snapshot established by the earlier validation SELECTs (taken before the doctor row lock) and
     * miss rows committed by a just-unblocked concurrent booking. READ_COMMITTED makes every
     * statement re-read the latest committed data, so the count after the lock is always fresh.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookResponse book(Long patientId, BookRequest request) {
        Doctor doctor = doctorService.getActiveOrThrow(request.doctorId()); // APT-R2

        LocalDate date = request.appointmentDate();
        LocalDate today = LocalDate.now();
        if (date.isBefore(today) || date.isAfter(today.plusDays(6))) { // APT-R3
            throw new BusinessException(ErrorCode.APT_DATE_OUT_OF_RANGE, "Appointment date must be within the next 7 days");
        }

        DoctorAvailability availability = doctorMapper
                .findActiveAvailabilityForDay(doctor.getId(), date.getDayOfWeek().getValue()) // APT-R4
                .orElseThrow(() -> new BusinessException(ErrorCode.APT_DOCTOR_NOT_AVAILABLE,
                        doctor.getFullName() + " is not available on " + date.getDayOfWeek()));

        if (date.isEqual(today) && !LocalTime.now().isBefore(availability.getEndTime())) { // APT-R5
            throw new BusinessException(ErrorCode.APT_BOOKING_CLOSED, "Booking is closed for today");
        }

        if (appointmentMapper.findActiveBooking(patientId, doctor.getId(), date).isPresent()) { // APT-R6
            throw new BusinessException(ErrorCode.APT_ALREADY_BOOKED,
                    "You already have a booking with this doctor on this date");
        }

        // Step 2: lock the doctor row so concurrent bookings for the same doctor+date serialize.
        Doctor locked = doctorMapper.lockForBooking(doctor.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_NOT_FOUND, "Doctor not found"));

        int bookedCount = countBooked(locked.getId(), date);
        if (bookedCount >= locked.getDailyLimit()) { // APT-R7
            throw new BusinessException(ErrorCode.APT_DOCTOR_FULLY_BOOKED,
                    locked.getFullName() + " is fully booked on " + date.format(DATE_FMT) + ". Please choose another date.");
        }

        int tokenNumber = bookedCount + 1; // APT-R8
        LocalTime reportingTime = computeReportingTime(availability, tokenNumber, locked.getDailyLimit());

        Appointment appointment = new Appointment();
        appointment.setPatientId(patientId);
        appointment.setDoctorId(locked.getId());
        appointment.setAppointmentDate(date);
        appointment.setTokenNumber(tokenNumber);
        appointment.setReportingTime(reportingTime);
        appointment.setReason(request.reason());
        appointment.setStatus("BOOKED");
        appointmentMapper.insert(appointment);

        String appointmentCode = "APT" + String.format("%08d", appointment.getId());
        appointmentMapper.updateAppointmentCode(appointment.getId(), appointmentCode);

        Patient patient = patientMapper.findById(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Patient not found"));
        Department department = departmentService.getById(locked.getDepartmentId());
        String patientName = fullName(patient);

        notificationService.notifyBookingSuccess(patientId, appointment.getId(), "Booking successful",
                "Your appointment with " + locked.getFullName() + " (" + department.getDeptName() + ") on "
                        + date.format(DATE_FMT) + " is confirmed. Token No: " + tokenNumber
                        + ". Please report by " + reportingTime.format(TIME_FMT) + ".");

        return new BookResponse(appointment.getId(), appointmentCode, tokenNumber, reportingTime, date,
                locked.getFullName(), department.getDeptName(),
                availability.getStartTime() + " - " + availability.getEndTime(), patientName, patient.getPatientCode());
    }

    public java.util.List<AppointmentSummaryResponse> listMy(Long patientId, boolean upcoming) {
        return appointmentMapper.findByPatient(patientId, upcoming).stream()
                .map(this::toSummary)
                .toList();
    }

    public AppointmentSummaryResponse getMyAppointment(Long patientId, Long appointmentId) {
        Appointment appointment = appointmentMapper.findByIdAndPatient(appointmentId, patientId) // APT-R10
                .orElseThrow(() -> new BusinessException(ErrorCode.APT_NOT_FOUND, "Appointment not found"));
        return toSummary(appointment);
    }

    private AppointmentSummaryResponse toSummary(Appointment appointment) {
        Doctor doctor = doctorService.getActiveOrThrow(appointment.getDoctorId());
        Department department = departmentService.getById(doctor.getDepartmentId());
        return new AppointmentSummaryResponse(appointment.getId(), appointment.getAppointmentCode(),
                doctor.getFullName(), department.getDeptName(), appointment.getAppointmentDate(),
                appointment.getTokenNumber(), appointment.getReportingTime(), appointment.getStatus());
    }

    private int countBooked(Long doctorId, LocalDate date) {
        return doctorMapper.countBookedAppointments(doctorId, date);
    }

    /** spec_details/03 §3 step 6: minutesPerPatient = floor(window minutes / dailyLimit), minimum 1. */
    private LocalTime computeReportingTime(DoctorAvailability availability, int tokenNumber, int dailyLimit) {
        long windowMinutes = Duration.between(availability.getStartTime(), availability.getEndTime()).toMinutes();
        long minutesPerPatient = Math.max(1, windowMinutes / dailyLimit);
        return availability.getStartTime().plusMinutes((long) (tokenNumber - 1) * minutesPerPatient);
    }

    private String fullName(Patient patient) {
        return patient.getLastName() == null || patient.getLastName().isBlank()
                ? patient.getFirstName()
                : patient.getFirstName() + " " + patient.getLastName();
    }
}
