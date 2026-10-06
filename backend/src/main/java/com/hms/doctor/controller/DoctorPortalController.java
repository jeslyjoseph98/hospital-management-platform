package com.hms.doctor.controller;

import com.hms.common.security.CurrentDoctor;
import com.hms.common.web.ApiResponse;
import com.hms.doctor.dto.AppointmentDetailResponse;
import com.hms.doctor.dto.ConsultationResponse;
import com.hms.doctor.dto.PatientDetailResponse;
import com.hms.doctor.dto.SaveConsultationRequest;
import com.hms.doctor.dto.TodayAppointmentsResponse;
import com.hms.doctor.service.DoctorPortalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor")
public class DoctorPortalController {

    private final DoctorPortalService doctorPortalService;

    public DoctorPortalController(DoctorPortalService doctorPortalService) {
        this.doctorPortalService = doctorPortalService;
    }

    @GetMapping("/appointments/today")
    public ApiResponse<TodayAppointmentsResponse> today() {
        return ApiResponse.ok(doctorPortalService.getToday(CurrentDoctor.id()));
    }

    @GetMapping("/appointments/{id}")
    public ApiResponse<AppointmentDetailResponse> appointmentDetail(@PathVariable Long id) {
        return ApiResponse.ok(doctorPortalService.getAppointmentDetail(CurrentDoctor.id(), id));
    }

    @GetMapping("/patients/{patientId}")
    public ApiResponse<PatientDetailResponse> patientDetail(@PathVariable Long patientId) {
        return ApiResponse.ok(doctorPortalService.getPatientDetail(CurrentDoctor.id(), patientId));
    }

    @PutMapping("/appointments/{id}/consultation")
    public ApiResponse<ConsultationResponse> saveConsultation(@PathVariable Long id,
                                                                @Valid @RequestBody SaveConsultationRequest request) {
        return ApiResponse.ok(doctorPortalService.save(CurrentDoctor.id(), id, request), "Consultation saved");
    }

    @PostMapping("/appointments/{id}/consultation/complete")
    public ApiResponse<ConsultationResponse> completeConsultation(@PathVariable Long id,
                                                                    @Valid @RequestBody SaveConsultationRequest request) {
        return ApiResponse.ok(doctorPortalService.complete(CurrentDoctor.id(), id, request), "Consultation completed");
    }
}
