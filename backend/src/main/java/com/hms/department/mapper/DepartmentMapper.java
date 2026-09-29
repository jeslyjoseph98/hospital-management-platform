package com.hms.department.mapper;

import com.hms.department.model.Department;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DepartmentMapper {

    List<Department> findActive();

    Optional<Department> findActiveById(@Param("id") Long id);

    Optional<Department> findById(@Param("id") Long id);
}
