package com.hms.department.service;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.department.dto.DepartmentResponse;
import com.hms.department.mapper.DepartmentMapper;
import com.hms.department.model.Department;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DepartmentService {

    private final DepartmentMapper departmentMapper;

    public DepartmentService(DepartmentMapper departmentMapper) {
        this.departmentMapper = departmentMapper;
    }

    public List<DepartmentResponse> listActive() {
        return departmentMapper.findActive().stream()
                .map(d -> new DepartmentResponse(d.getId(), d.getDeptName(), d.getDescription()))
                .toList();
    }

    /** DOC-R3: department not found or inactive -> DOC_DEPARTMENT_NOT_FOUND. */
    public Department getActiveOrThrow(Long departmentId) {
        return departmentMapper.findActiveById(departmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_DEPARTMENT_NOT_FOUND, "Department not found"));
    }

    /** For display purposes once a doctor/appointment already resolved the department id. */
    public Department getById(Long departmentId) {
        return departmentMapper.findById(departmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOC_DEPARTMENT_NOT_FOUND, "Department not found"));
    }
}
