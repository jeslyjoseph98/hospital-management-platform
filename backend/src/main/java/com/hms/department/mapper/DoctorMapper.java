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

    /** REG-R11: doctor self-registration looks the profile up by registration number. */
    Optional<Doctor> findActiveByRegistrationNumber(@Param("registrationNumber") String registrationNumber);

    /** Login (spec 01 LOG-R2/LOG-R3): resolve the doctor linked to this user, active or not. */
    Optional<Doctor> findByUserId(@Param("userId") Long userId);

    /** REG-R13: link the newly created user account to the doctor profile. */
    void linkUser(@Param("id") Long id, @Param("userId") Long userId);
}
