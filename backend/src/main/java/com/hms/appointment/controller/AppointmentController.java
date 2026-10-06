package com.hms.appointment.controller;

import com.hms.appointment.dto.AppointmentSummaryResponse;
import com.hms.appointment.dto.BookRequest;
import com.hms.appointment.dto.BookResponse;
import com.hms.appointment.service.AppointmentService;
import com.hms.common.security.CurrentPatient;
import com.hms.common.web.ApiResponse;
import com.hms.doctor.dto.PatientConsultationResponse;
import com.hms.doctor.service.DoctorPortalService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final DoctorPortalService doctorPortalService;

    public AppointmentController(AppointmentService appointmentService, DoctorPortalService doctorPortalService) {
        this.appointmentService = appointmentService;
        this.doctorPortalService = doctorPortalService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookResponse>> book(@Valid @RequestBody BookRequest request) {
        BookResponse response = appointmentService.book(CurrentPatient.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Booking successful"));
    }

    @GetMapping("/my")
    public ApiResponse<List<AppointmentSummaryResponse>> my(@RequestParam(defaultValue = "true") boolean upcoming) {
        return ApiResponse.ok(appointmentService.listMy(CurrentPatient.id(), upcoming));
    }

    @GetMapping("/{id}")
    public ApiResponse<AppointmentSummaryResponse> detail(@PathVariable Long id) {
        return ApiResponse.ok(appointmentService.getMyAppointment(CurrentPatient.id(), id));
    }

    @GetMapping("/{id}/consultation")
    public ApiResponse<PatientConsultationResponse> consultation(@PathVariable Long id) {
        return ApiResponse.ok(doctorPortalService.getForPatient(CurrentPatient.id(), id));
    }
}
