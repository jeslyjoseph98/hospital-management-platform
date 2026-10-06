package com.hms.admin.service;

import com.hms.admin.dto.AdminDepartmentResponse;
import com.hms.admin.dto.CreateDepartmentRequest;
import com.hms.admin.dto.UpdateDepartmentRequest;
import com.hms.admin.mapper.AdminDepartmentMapper;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.department.model.Department;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDepartmentService {

    private final AdminDepartmentMapper adminDepartmentMapper;

    public AdminDepartmentService(AdminDepartmentMapper adminDepartmentMapper) {
        this.adminDepartmentMapper = adminDepartmentMapper;
    }

    public List<AdminDepartmentResponse> listAll() {
        return adminDepartmentMapper.findAll();
    }

    @Transactional
    public AdminDepartmentResponse create(CreateDepartmentRequest request, Long adminId) {
        if (adminDepartmentMapper.existsByNameIgnoreCase(request.deptName(), null)) { // DEP-R1
            throw new BusinessException(ErrorCode.ADM_DEPARTMENT_EXISTS, "A department with this name already exists");
        }
        Department department = new Department();
        department.setDeptName(request.deptName());
        department.setDescription(request.description());
        department.setCreatedBy(adminId);
        adminDepartmentMapper.insert(department);
        return getOrThrow(department.getId());
    }

    @Transactional
    public AdminDepartmentResponse update(Long id, UpdateDepartmentRequest request, Long adminId) {
        getOrThrow(id);
        if (adminDepartmentMapper.existsByNameIgnoreCase(request.deptName(), id)) { // DEP-R1
            throw new BusinessException(ErrorCode.ADM_DEPARTMENT_EXISTS, "A department with this name already exists");
        }
        adminDepartmentMapper.update(id, request.deptName(), request.description(), adminId);
        return getOrThrow(id);
    }

    @Transactional
    public AdminDepartmentResponse updateStatus(Long id, boolean active, Long adminId) {
        getOrThrow(id);
        if (!active && adminDepartmentMapper.countActiveDoctors(id) > 0) { // DEP-R2
            throw new BusinessException(ErrorCode.ADM_DEPARTMENT_HAS_DOCTORS,
                    "Deactivate or move this department's doctors first");
        }
        adminDepartmentMapper.updateStatus(id, active, adminId);
        return getOrThrow(id);
    }

    private AdminDepartmentResponse getOrThrow(Long id) {
        return adminDepartmentMapper.findByIdWithCount(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_DEPARTMENT_NOT_FOUND, "Department not found"));
    }
}
