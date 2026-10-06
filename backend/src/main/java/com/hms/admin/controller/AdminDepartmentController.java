package com.hms.admin.controller;

import com.hms.admin.dto.AdminDepartmentResponse;
import com.hms.admin.dto.CreateDepartmentRequest;
import com.hms.admin.dto.StatusRequest;
import com.hms.admin.dto.UpdateDepartmentRequest;
import com.hms.admin.service.AdminDepartmentService;
import com.hms.common.security.CurrentAdmin;
import com.hms.common.web.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/departments")
public class AdminDepartmentController {

    private final AdminDepartmentService adminDepartmentService;

    public AdminDepartmentController(AdminDepartmentService adminDepartmentService) {
        this.adminDepartmentService = adminDepartmentService;
    }

    @GetMapping
    public ApiResponse<List<AdminDepartmentResponse>> list() {
        return ApiResponse.ok(adminDepartmentService.listAll());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminDepartmentResponse>> create(@Valid @RequestBody CreateDepartmentRequest request) {
        AdminDepartmentResponse response = adminDepartmentService.create(request, CurrentAdmin.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Department created successfully"));
    }

    @PutMapping("/{id}")
    public ApiResponse<AdminDepartmentResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateDepartmentRequest request) {
        return ApiResponse.ok(adminDepartmentService.update(id, request, CurrentAdmin.id()));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<AdminDepartmentResponse> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        return ApiResponse.ok(adminDepartmentService.updateStatus(id, request.active(), CurrentAdmin.id()));
    }
}
