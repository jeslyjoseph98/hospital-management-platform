package com.hms.doctor.service;

import com.hms.appointment.mapper.AppointmentMapper;
import com.hms.appointment.model.Appointment;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.doctor.dto.AppointmentDetailResponse;
import com.hms.doctor.dto.ConsultationResponse;
import com.hms.doctor.dto.ConsultationResponse.PrescriptionItemResponse;
import com.hms.doctor.dto.PatientBrief;
import com.hms.doctor.dto.PatientConsultationResponse;
import com.hms.doctor.dto.PatientDetailResponse;
import com.hms.doctor.dto.PatientDetailResponse.PastVisit;
import com.hms.doctor.dto.SaveConsultationRequest;
import com.hms.doctor.dto.SaveConsultationRequest.PrescriptionItemRequest;
import com.hms.doctor.dto.TodayAppointmentsResponse;
import com.hms.doctor.dto.TodayAppointmentsResponse.AppointmentItem;
import com.hms.doctor.mapper.ConsultationMapper;
import com.hms.doctor.mapper.DoctorAppointmentMapper;
import com.hms.doctor.model.Consultation;
import com.hms.doctor.model.PrescriptionItem;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorPortalService {

    private static final Pattern DOSAGE_PATTERN = Pattern.compile("^[0-9]-[0-9]-[0-9]$");
    private static final int MAX_PRESCRIPTION_ITEMS = 20;

    private final DoctorAppointmentMapper doctorAppointmentMapper;
    private final ConsultationMapper consultationMapper;
    private final AppointmentMapper appointmentMapper;

    public DoctorPortalService(DoctorAppointmentMapper doctorAppointmentMapper, ConsultationMapper consultationMapper,
                                AppointmentMapper appointmentMapper) {
        this.doctorAppointmentMapper = doctorAppointmentMapper;
        this.consultationMapper = consultationMapper;
        this.appointmentMapper = appointmentMapper;
    }

    /** DRP-R2 to DRP-R4: today's appointments for this doctor, with header counts. */
    public TodayAppointmentsResponse getToday(Long doctorId) {
        LocalDate today = LocalDate.now();
        List<AppointmentItem> items = doctorAppointmentMapper.findToday(doctorId, today);
        int completed = (int) items.stream().filter(i -> "COMPLETED".equals(i.status())).count();
        return new TodayAppointmentsResponse(today, items.size(), completed, items.size() - completed, items);
    }

    public AppointmentDetailResponse getAppointmentDetail(Long doctorId, Long appointmentId) {
        Appointment appointment = doctorAppointmentMapper.findByIdAndDoctor(appointmentId, doctorId) // DRP-R8
                .orElseThrow(() -> new BusinessException(ErrorCode.DRP_NOT_YOUR_APPOINTMENT, "Appointment not found"));
        PatientBrief patient = doctorAppointmentMapper.findPatientBrief(appointment.getPatientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.DRP_PATIENT_NOT_FOUND, "Patient not found"));
        ConsultationResponse consultation = consultationMapper.findByAppointmentId(appointmentId)
                .map(this::toConsultationResponse)
                .orElse(null);
        return new AppointmentDetailResponse(appointment.getId(), appointment.getTokenNumber(), appointment.getAppointmentDate(),
                appointment.getReportingTime(), appointment.getReason(), appointment.getStatus(), patient, consultation);
    }

    /** DRP-R5 to DRP-R7: patient details + past visits, only if this patient has visited this doctor. */
    public PatientDetailResponse getPatientDetail(Long doctorId, Long patientId) {
        if (!doctorAppointmentMapper.existsAppointmentForPatientAndDoctor(patientId, doctorId)) { // DRP-R5
            throw new BusinessException(ErrorCode.DRP_PATIENT_NOT_FOUND, "Patient not found");
        }
        PatientBrief patient = doctorAppointmentMapper.findPatientBrief(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DRP_PATIENT_NOT_FOUND, "Patient not found"));
        List<PastVisit> pastVisits = consultationMapper.findPastVisitsByPatient(patientId).stream()
                .map(row -> new PastVisit(row.date(), row.doctorName(), row.departmentName(), row.diagnosis(),
                        row.advice(), row.doctorNotes(), prescriptionItems(row.consultationId()),
                        row.dispenseStatus(), row.dispensedAt(), row.dispenseRemarks()))
                .toList();
        return new PatientDetailResponse(patient, pastVisits);
    }

    @Transactional
    public ConsultationResponse save(Long doctorId, Long appointmentId, SaveConsultationRequest request) {
        Appointment appointment = requireOwnedTodayBookedAppointment(doctorId, appointmentId);
        validate(request);
        return toConsultationResponse(upsert(appointment, request));
    }

    @Transactional
    public ConsultationResponse complete(Long doctorId, Long appointmentId, SaveConsultationRequest request) {
        Appointment appointment = requireOwnedTodayBookedAppointment(doctorId, appointmentId);
        validate(request);
        if (request.diagnosis() == null || request.diagnosis().isBlank()) { // DRP-R15
            throw new BusinessException(ErrorCode.DRP_DIAGNOSIS_REQUIRED, "Diagnosis is required to complete the consultation");
        }
        Consultation consultation = upsert(appointment, request);
        LocalDateTime now = LocalDateTime.now();
        List<PrescriptionItemRequest> items = request.prescription() == null ? List.of() : request.prescription();
        String dispenseStatus = items.isEmpty() ? "NOT_REQUIRED" : "PENDING"; // spec 07 §3
        consultationMapper.complete(consultation.getId(), now, dispenseStatus); // DRP-R15
        doctorAppointmentMapper.completeAppointment(appointment.getId());
        consultation.setStatus("COMPLETED");
        consultation.setCompletedAt(now);
        consultation.setDispenseStatus(dispenseStatus);
        return toConsultationResponse(consultation);
    }

    /** DRP-R17: a patient viewing their own completed consultation. */
    public PatientConsultationResponse getForPatient(Long patientId, Long appointmentId) {
        appointmentMapper.findByIdAndPatient(appointmentId, patientId) // ownership, mirrors APT-R10
                .orElseThrow(() -> new BusinessException(ErrorCode.APT_NOT_FOUND, "Appointment not found"));
        ConsultationMapper.PatientConsultationRow row = consultationMapper.findPatientView(appointmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.APT_NOT_FOUND, "Consultation not available yet"));
        return new PatientConsultationResponse(row.date(), row.doctorName(), row.diagnosis(), row.advice(),
                row.followUpDate(), row.temperatureC(), row.pulseBpm(), row.bpSystolic(), row.bpDiastolic(),
                row.weightKg(), prescriptionItems(row.consultationId()), row.dispenseStatus(), row.dispensedAt(),
                row.dispenseRemarks());
    }

    private Appointment requireOwnedTodayBookedAppointment(Long doctorId, Long appointmentId) {
        Appointment appointment = doctorAppointmentMapper.findByIdAndDoctor(appointmentId, doctorId) // DRP-R8
                .orElseThrow(() -> new BusinessException(ErrorCode.DRP_NOT_YOUR_APPOINTMENT, "Appointment not found"));
        if (!appointment.getAppointmentDate().isEqual(LocalDate.now())) { // DRP-R9
            throw new BusinessException(ErrorCode.DRP_NOT_TODAY, "Consultation can only be recorded on the appointment date");
        }
        if (!"BOOKED".equals(appointment.getStatus())) { // DRP-R10 / DRP-R16
            throw new BusinessException(ErrorCode.DRP_ALREADY_COMPLETED, "This consultation is already completed");
        }
        return appointment;
    }

    /** DRP-R12 to DRP-R14. */
    private void validate(SaveConsultationRequest request) {
        if (request.temperatureC() != null
                && (request.temperatureC().compareTo(BigDecimal.valueOf(30)) < 0
                || request.temperatureC().compareTo(BigDecimal.valueOf(45)) > 0)) {
            throw new BusinessException(ErrorCode.DRP_VITALS_INVALID, "Temperature must be between 30 and 45 C");
        }
        if (request.pulseBpm() != null && (request.pulseBpm() < 20 || request.pulseBpm() > 250)) {
            throw new BusinessException(ErrorCode.DRP_VITALS_INVALID, "Pulse must be between 20 and 250 bpm");
        }
        if (request.bpSystolic() != null && (request.bpSystolic() < 50 || request.bpSystolic() > 260)) {
            throw new BusinessException(ErrorCode.DRP_VITALS_INVALID, "Systolic BP must be between 50 and 260");
        }
        if (request.bpDiastolic() != null && (request.bpDiastolic() < 30 || request.bpDiastolic() > 160)) {
            throw new BusinessException(ErrorCode.DRP_VITALS_INVALID, "Diastolic BP must be between 30 and 160");
        }
        if (request.weightKg() != null
                && (request.weightKg().compareTo(BigDecimal.valueOf(0.5)) < 0
                || request.weightKg().compareTo(BigDecimal.valueOf(350)) > 0)) {
            throw new BusinessException(ErrorCode.DRP_VITALS_INVALID, "Weight must be between 0.5 and 350 kg");
        }
        if (request.followUpDate() != null && !request.followUpDate().isAfter(LocalDate.now())) { // DRP-R13
            throw new BusinessException(ErrorCode.DRP_FOLLOWUP_INVALID, "Follow-up date must be after today");
        }

        List<PrescriptionItemRequest> items = request.prescription() == null ? List.of() : request.prescription();
        if (items.size() > MAX_PRESCRIPTION_ITEMS) { // DRP-R14
            throw new BusinessException(ErrorCode.DRP_TOO_MANY_ITEMS, "A prescription can have at most 20 items");
        }
        for (PrescriptionItemRequest item : items) {
            if (!DOSAGE_PATTERN.matcher(item.dosagePattern()).matches()) {
                throw new BusinessException(ErrorCode.DRP_DOSAGE_INVALID,
                        "Dosage pattern must look like 1-0-1");
            }
            if ("0-0-0".equals(item.dosagePattern()) && !"AS_NEEDED".equals(item.timing())) {
                throw new BusinessException(ErrorCode.DRP_DOSAGE_INVALID,
                        "0-0-0 is only valid when timing is AS_NEEDED");
            }
        }
    }

    /** DRP-R11: insert if no consultation exists yet, else update; prescription items are always replaced. */
    private Consultation upsert(Appointment appointment, SaveConsultationRequest request) {
        Consultation consultation = consultationMapper.findByAppointmentId(appointment.getId()).orElse(null);
        if (consultation == null) {
            consultation = new Consultation();
            consultation.setAppointmentId(appointment.getId());
            consultation.setPatientId(appointment.getPatientId());
            consultation.setDoctorId(appointment.getDoctorId());
            consultation.setStatus("IN_PROGRESS");
            applyFields(consultation, request);
            consultationMapper.insert(consultation);
        } else {
            applyFields(consultation, request);
            consultationMapper.update(consultation);
        }

        consultationMapper.deleteItems(consultation.getId());
        List<PrescriptionItemRequest> items = request.prescription() == null ? List.of() : request.prescription();
        int order = 0;
        for (PrescriptionItemRequest itemRequest : items) {
            PrescriptionItem item = new PrescriptionItem();
            item.setConsultationId(consultation.getId());
            item.setMedicineName(itemRequest.medicineName());
            item.setStrength(itemRequest.strength());
            item.setDosagePattern(itemRequest.dosagePattern());
            item.setTiming(itemRequest.timing());
            item.setDurationDays(itemRequest.durationDays());
            item.setInstructions(itemRequest.instructions());
            item.setDisplayOrder(order++);
            consultationMapper.insertItem(item);
        }
        return consultation;
    }

    private void applyFields(Consultation consultation, SaveConsultationRequest request) {
        consultation.setChiefComplaint(request.chiefComplaint());
        consultation.setSymptoms(request.symptoms());
        consultation.setTemperatureC(request.temperatureC());
        consultation.setPulseBpm(request.pulseBpm());
        consultation.setBpSystolic(request.bpSystolic());
        consultation.setBpDiastolic(request.bpDiastolic());
        consultation.setWeightKg(request.weightKg());
        consultation.setDiagnosis(request.diagnosis());
        consultation.setDoctorNotes(request.doctorNotes());
        consultation.setAdvice(request.advice());
        consultation.setFollowUpDate(request.followUpDate());
    }

    private ConsultationResponse toConsultationResponse(Consultation consultation) {
        return new ConsultationResponse(consultation.getId(), consultation.getStatus(), consultation.getChiefComplaint(),
                consultation.getSymptoms(), consultation.getTemperatureC(), consultation.getPulseBpm(),
                consultation.getBpSystolic(), consultation.getBpDiastolic(), consultation.getWeightKg(),
                consultation.getDiagnosis(), consultation.getDoctorNotes(), consultation.getAdvice(),
                consultation.getFollowUpDate(), prescriptionItems(consultation.getId()));
    }

    private List<PrescriptionItemResponse> prescriptionItems(Long consultationId) {
        return consultationMapper.findItems(consultationId).stream()
                .map(i -> new PrescriptionItemResponse(i.getMedicineName(), i.getStrength(), i.getDosagePattern(),
                        i.getTiming(), i.getDurationDays(), i.getInstructions()))
                .toList();
    }
}
