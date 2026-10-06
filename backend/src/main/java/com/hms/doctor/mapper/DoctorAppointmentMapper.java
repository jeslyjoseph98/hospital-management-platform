package com.hms.doctor.mapper;

import com.hms.appointment.model.Appointment;
import com.hms.doctor.dto.PatientBrief;
import com.hms.doctor.dto.TodayAppointmentsResponse.AppointmentItem;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DoctorAppointmentMapper {

    /** DRP-R2/DRP-R3: today's appointments for this doctor, ordered by token. */
    List<AppointmentItem> findToday(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    /** DRP-R8: ownership check — the appointment must belong to this doctor. */
    Optional<Appointment> findByIdAndDoctor(@Param("id") Long id, @Param("doctorId") Long doctorId);

    void completeAppointment(@Param("id") Long id);

    Optional<PatientBrief> findPatientBrief(@Param("patientId") Long patientId);

    /** DRP-R5: a doctor can open a patient only if that patient has an appointment with them. */
    boolean existsAppointmentForPatientAndDoctor(@Param("patientId") Long patientId, @Param("doctorId") Long doctorId);
}
