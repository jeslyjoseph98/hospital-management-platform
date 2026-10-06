package com.hms.admin.controller;

import com.hms.admin.dto.AdminDoctorResponse;
import com.hms.admin.dto.AdminDoctorSummaryResponse;
import com.hms.admin.dto.CreateDoctorRequest;
import com.hms.admin.dto.DoctorBookingsResponse;
import com.hms.admin.dto.ReplaceTimingsRequest;
import com.hms.admin.dto.StatusRequest;
import com.hms.admin.dto.UpdateDoctorRequest;
import com.hms.admin.service.AdminDoctorService;
import com.hms.common.security.CurrentAdmin;
import com.hms.common.web.ApiResponse;
import com.hms.common.web.PagedResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/doctors")
public class AdminDoctorController {

    private final AdminDoctorService adminDoctorService;

    public AdminDoctorController(AdminDoctorService adminDoctorService) {
        this.adminDoctorService = adminDoctorService;
    }

    @GetMapping
    public ApiResponse<PagedResponse<AdminDoctorSummaryResponse>> list(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(adminDoctorService.list(departmentId, name, active, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<AdminDoctorResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(adminDoctorService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminDoctorResponse>> create(@Valid @RequestBody CreateDoctorRequest request) {
        AdminDoctorResponse response = adminDoctorService.create(request, CurrentAdmin.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Doctor added successfully"));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminDoctorResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateDoctorRequest request) {
        return ApiResponse.ok(adminDoctorService.update(id, request, CurrentAdmin.id()));
    }

    @PutMapping("/{id}/timings")
    public ApiResponse<AdminDoctorResponse> replaceTimings(@PathVariable Long id, @Valid @RequestBody ReplaceTimingsRequest request) {
        return ApiResponse.ok(adminDoctorService.replaceTimings(id, request, CurrentAdmin.id()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminDoctorResponse> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        return ApiResponse.ok(adminDoctorService.updateStatus(id, request.active(), CurrentAdmin.id()));
    }

    @GetMapping("/{id}/bookings")
    public ApiResponse<DoctorBookingsResponse> bookings(@PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(adminDoctorService.bookingsForDate(id, date));
    }
}
