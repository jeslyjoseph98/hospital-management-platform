package com.hms.patient.controller;

import com.hms.common.security.CurrentPatient;
import com.hms.common.web.ApiResponse;
import com.hms.patient.dto.PatientProfileResponse;
import com.hms.patient.service.PatientService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/me")
    public ApiResponse<PatientProfileResponse> me() {
        return ApiResponse.ok(patientService.getProfile(CurrentPatient.id()));
    }
}
