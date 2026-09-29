package com.hms.appointment.mapper;

import com.hms.appointment.model.Appointment;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AppointmentMapper {

    Optional<Appointment> findActiveBooking(@Param("patientId") Long patientId,
                                             @Param("doctorId") Long doctorId,
                                             @Param("date") LocalDate date);

    void insert(Appointment appointment);

    void updateAppointmentCode(@Param("id") Long id, @Param("appointmentCode") String appointmentCode);

    List<Appointment> findByPatient(@Param("patientId") Long patientId, @Param("upcoming") boolean upcoming);

    Optional<Appointment> findByIdAndPatient(@Param("id") Long id, @Param("patientId") Long patientId);
}
