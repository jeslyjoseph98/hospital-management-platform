package com.hms.patient.service;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.common.security.JwtService;
import com.hms.patient.dto.LoginRequest;
import com.hms.patient.dto.LoginResponse;
import com.hms.patient.dto.PatientProfileResponse;
import com.hms.patient.dto.RegisterRequest;
import com.hms.patient.dto.RegisterResponse;
import com.hms.patient.mapper.PatientMapper;
import com.hms.patient.model.Patient;
import java.time.LocalDate;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");

    private final PatientMapper patientMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public PatientService(PatientMapper patientMapper, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.patientMapper = patientMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (!PHONE_PATTERN.matcher(request.phone()).matches()) {
            throw new BusinessException(ErrorCode.PAT_PHONE_INVALID, "Phone must be 10 digits starting with 6-9");
        }
        if (patientMapper.findByPhone(request.phone()).isPresent()) {
            throw new BusinessException(ErrorCode.PAT_PHONE_EXISTS, "Phone is already registered");
        }
        if (request.email() != null && !request.email().isBlank()
                && patientMapper.findByEmail(request.email()).isPresent()) {
            throw new BusinessException(ErrorCode.PAT_EMAIL_EXISTS, "Email is already registered");
        }
        if (request.dateOfBirth().isAfter(LocalDate.now())) {
            throw new BusinessException(ErrorCode.PAT_DOB_INVALID, "Date of birth cannot be in the future");
        }
        if (!PASSWORD_PATTERN.matcher(request.password()).matches()) {
            throw new BusinessException(ErrorCode.PAT_WEAK_PASSWORD,
                    "Password must be at least 8 characters with at least one letter and one digit");
        }

        Patient patient = new Patient();
        patient.setFirstName(request.firstName());
        patient.setLastName(request.lastName());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setPhone(request.phone());
        patient.setEmail(request.email());
        patient.setPasswordHash(passwordEncoder.encode(request.password()));
        patient.setAddress(request.address());

        patientMapper.insert(patient);

        String patientCode = "PAT" + String.format("%06d", patient.getId());
        patientMapper.updatePatientCode(patient.getId(), patientCode);

        return new RegisterResponse(patient.getId(), patientCode);
    }

    public LoginResponse login(LoginRequest request) {
        Patient patient = patientMapper.findByPhone(request.phone())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid phone or password"));

        if (!passwordEncoder.matches(request.password(), patient.getPasswordHash())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid phone or password");
        }
        if (!patient.isActive()) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_INACTIVE, "Account is inactive");
        }

        String name = fullName(patient);
        String token = jwtService.generateToken(patient.getId(), name, patient.getPatientCode());

        return new LoginResponse(token, jwtService.getExpirationSeconds(),
                new LoginResponse.PatientSummary(patient.getId(), patient.getPatientCode(), name));
    }

    public PatientProfileResponse getProfile(Long patientId) {
        Patient patient = patientMapper.findById(patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Patient not found"));
        return new PatientProfileResponse(patient.getId(), patient.getPatientCode(), patient.getFirstName(),
                patient.getLastName(), patient.getDateOfBirth(), patient.getGender(), patient.getPhone(),
                patient.getEmail(), patient.getAddress());
    }

    private String fullName(Patient patient) {
        return patient.getLastName() == null || patient.getLastName().isBlank()
                ? patient.getFirstName()
                : patient.getFirstName() + " " + patient.getLastName();
    }
}
