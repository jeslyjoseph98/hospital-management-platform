package com.hms.patient.service;

import com.hms.auth.mapper.UserMapper;
import com.hms.auth.model.User;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.patient.dto.PatientProfileResponse;
import com.hms.patient.mapper.PatientMapper;
import com.hms.patient.model.Patient;
import org.springframework.stereotype.Service;

@Service
public class PatientService {

    private final PatientMapper patientMapper;
    private final UserMapper userMapper;

    public PatientService(PatientMapper patientMapper, UserMapper userMapper) {
        this.patientMapper = patientMapper;
        this.userMapper = userMapper;
    }

    public PatientProfileResponse getProfile(Long patientId) {
        Patient patient = patientMapper.findById(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Patient not found"));
        User user = userMapper.findById(patient.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Patient not found"));
        return new PatientProfileResponse(patient.getId(), patient.getPatientCode(), user.getFullName(),
                patient.getDateOfBirth(), patient.getGender(), user.getPhone(), user.getEmail(), patient.getAddress());
    }
}
