package com.hms.department.controller;

import com.hms.common.web.ApiResponse;
import com.hms.department.dto.DepartmentResponse;
import com.hms.department.dto.DoctorWithTimingsResponse;
import com.hms.department.service.DepartmentService;
import com.hms.department.service.DoctorService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/departments")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final DoctorService doctorService;

    public DepartmentController(DepartmentService departmentService, DoctorService doctorService) {
        this.departmentService = departmentService;
        this.doctorService = doctorService;
    }

    @GetMapping
    public ApiResponse<List<DepartmentResponse>> list() {
        return ApiResponse.ok(departmentService.listActive());
    }

    @GetMapping("/{id}/doctors")
    public ApiResponse<List<DoctorWithTimingsResponse>> doctors(@PathVariable Long id) {
        return ApiResponse.ok(doctorService.listByDepartment(id));
    }
}
