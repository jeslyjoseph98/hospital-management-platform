package com.hms.department.controller;

import com.hms.common.web.ApiResponse;
import com.hms.department.dto.DoctorAvailabilityResponse;
import com.hms.department.service.DoctorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/{id}/availability")
    public ApiResponse<DoctorAvailabilityResponse> availability(@PathVariable Long id) {
        return ApiResponse.ok(doctorService.getAvailability(id));
    }
}
