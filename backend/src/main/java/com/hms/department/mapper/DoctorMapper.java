package com.hms.department.mapper;

import com.hms.department.model.Doctor;
import com.hms.department.model.DoctorAvailability;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DoctorMapper {

    List<Doctor> findActiveByDepartment(@Param("departmentId") Long departmentId);

    Optional<Doctor> findActiveById(@Param("id") Long id);

    /** Locks the doctor row for the duration of the booking transaction (spec_details/03 §3 step 2). */
    Optional<Doctor> lockForBooking(@Param("id") Long id);

    List<DoctorAvailability> findActiveAvailability(@Param("doctorId") Long doctorId);

    Optional<DoctorAvailability> findActiveAvailabilityForDay(@Param("doctorId") Long doctorId,
                                                               @Param("dayOfWeek") int dayOfWeek);

    int countBookedAppointments(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);
}
