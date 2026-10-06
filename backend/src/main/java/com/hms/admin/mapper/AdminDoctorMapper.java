package com.hms.admin.mapper;

import com.hms.admin.dto.AffectedDate;
import com.hms.admin.dto.DoctorBookingsResponse;
import com.hms.department.model.Doctor;
import com.hms.department.model.DoctorAvailability;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminDoctorMapper {

    List<Doctor> findAll(@Param("departmentId") Long departmentId, @Param("name") String name,
                          @Param("active") Boolean active, @Param("offset") int offset, @Param("limit") int limit);

    long countAll(@Param("departmentId") Long departmentId, @Param("name") String name, @Param("active") Boolean active);

    Optional<Doctor> findById(@Param("id") Long id);

    boolean existsByRegistrationNumber(@Param("registrationNumber") String registrationNumber,
                                        @Param("excludeId") Long excludeId);

    void insert(Doctor doctor);

    void update(Doctor doctor);

    void updateStatus(@Param("id") Long id, @Param("active") boolean active, @Param("updatedBy") Long updatedBy);

    void deleteAvailability(@Param("doctorId") Long doctorId);

    void insertAvailability(DoctorAvailability availability);

    /** Future (>= today) BOOKED counts grouped by date, for AVL-R4/R5 and DOC-A6 checks. */
    List<AffectedDate> findFutureBookedCounts(@Param("doctorId") Long doctorId);

    List<DoctorBookingsResponse.TokenEntry> findBookingsForDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);
}
