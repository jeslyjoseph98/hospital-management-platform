package com.hms.patient.mapper;

import com.hms.patient.model.Patient;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PatientMapper {

    Optional<Patient> findByPhone(@Param("phone") String phone);

    Optional<Patient> findByEmail(@Param("email") String email);

    Optional<Patient> findById(@Param("id") Long id);

    void insert(Patient patient);

    void updatePatientCode(@Param("id") Long id, @Param("patientCode") String patientCode);
}
