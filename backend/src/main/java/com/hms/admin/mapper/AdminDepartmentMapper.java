package com.hms.admin.mapper;

import com.hms.admin.dto.AdminDepartmentResponse;
import com.hms.department.model.Department;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminDepartmentMapper {

    List<AdminDepartmentResponse> findAll();

    Optional<AdminDepartmentResponse> findByIdWithCount(@Param("id") Long id);

    boolean existsByNameIgnoreCase(@Param("deptName") String deptName, @Param("excludeId") Long excludeId);

    void insert(Department department);

    void update(@Param("id") Long id, @Param("deptName") String deptName,
                @Param("description") String description, @Param("updatedBy") Long updatedBy);

    void updateStatus(@Param("id") Long id, @Param("active") boolean active, @Param("updatedBy") Long updatedBy);

    int countActiveDoctors(@Param("departmentId") Long departmentId);
}
