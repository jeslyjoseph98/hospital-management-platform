package com.hms.auth.service;

import com.hms.auth.dto.LoginRequest;
import com.hms.auth.dto.LoginResponse;
import com.hms.auth.dto.RegisterRequest;
import com.hms.auth.dto.RegisterResponse;
import com.hms.auth.dto.UserSummary;
import com.hms.auth.mapper.UserMapper;
import com.hms.auth.model.User;
import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.common.security.AuthenticatedUser;
import com.hms.common.security.JwtService;
import com.hms.department.mapper.DoctorMapper;
import com.hms.department.model.Doctor;
import com.hms.patient.mapper.PatientMapper;
import com.hms.patient.model.Patient;
import java.time.LocalDate;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");

    private final UserMapper userMapper;
    private final PatientMapper patientMapper;
    private final DoctorMapper doctorMapper;
    private static final java.util.Set<String> VALID_ROLES = java.util.Set.of("PATIENT", "ADMIN", "DOCTOR", "PHARMACIST");

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String adminRegistrationCode;
    private final String pharmacyRegistrationCode;

    public AuthService(UserMapper userMapper, PatientMapper patientMapper, DoctorMapper doctorMapper,
                        PasswordEncoder passwordEncoder, JwtService jwtService,
                        @Value("${hms.admin-registration-code}") String adminRegistrationCode,
                        @Value("${hms.pharmacy-registration-code}") String pharmacyRegistrationCode) {
        this.userMapper = userMapper;
        this.patientMapper = patientMapper;
        this.doctorMapper = doctorMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminRegistrationCode = adminRegistrationCode;
        this.pharmacyRegistrationCode = pharmacyRegistrationCode;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String role = request.role() == null ? "" : request.role().toUpperCase();
        if (!VALID_ROLES.contains(role)) { // REG-R1
            throw new BusinessException(ErrorCode.REG_INVALID_ROLE, "role must be PATIENT, DOCTOR, PHARMACIST or ADMIN");
        }
        if (!PHONE_PATTERN.matcher(request.phone()).matches()) { // REG-R3
            throw new BusinessException(ErrorCode.REG_PHONE_INVALID, "Phone must be 10 digits starting with 6-9");
        }
        if (userMapper.findByPhone(request.phone()).isPresent()) { // REG-R4
            throw new BusinessException(ErrorCode.REG_PHONE_EXISTS, "Phone is already registered");
        }
        if (request.email() != null && !request.email().isBlank()
                && userMapper.findByEmail(request.email()).isPresent()) { // REG-R5
            throw new BusinessException(ErrorCode.REG_EMAIL_EXISTS, "Email is already registered");
        }
        if (!PASSWORD_PATTERN.matcher(request.password()).matches()) { // REG-R6
            throw new BusinessException(ErrorCode.REG_WEAK_PASSWORD,
                    "Password must be at least 8 characters with at least one letter and one digit");
        }
        Doctor doctor = null;
        if (role.equals("PATIENT")) { // REG-R7
            if (request.dateOfBirth() == null || request.gender() == null || request.gender().isBlank()
                    || request.dateOfBirth().isAfter(LocalDate.now())) {
                throw new BusinessException(ErrorCode.REG_DOB_INVALID,
                        "Date of birth and gender are required and date of birth cannot be in the future");
            }
        } else if (role.equals("ADMIN")) { // REG-R8
            if (request.adminCode() == null || !request.adminCode().equals(adminRegistrationCode)) {
                throw new BusinessException(ErrorCode.REG_ADMIN_CODE_INVALID, "Invalid admin registration code");
            }
        } else if (role.equals("PHARMACIST")) { // REG-R8a
            if (request.staffCode() == null || !request.staffCode().equals(pharmacyRegistrationCode)) {
                throw new BusinessException(ErrorCode.REG_STAFF_CODE_INVALID, "Invalid staff registration code");
            }
        } else { // DOCTOR: REG-R11 to REG-R13
            doctor = doctorMapper.findActiveByRegistrationNumber(request.registrationNumber())
                    .orElseThrow(() -> new BusinessException(ErrorCode.REG_DOCTOR_NOT_FOUND,
                            "Ask the admin to add your profile first"));
            if (!request.phone().equals(doctor.getPhone())) { // REG-R12
                throw new BusinessException(ErrorCode.REG_DOCTOR_PHONE_MISMATCH,
                        "Phone does not match the number on file for this doctor");
            }
            if (doctor.getUserId() != null) { // REG-R13
                throw new BusinessException(ErrorCode.REG_DOCTOR_ALREADY_REGISTERED,
                        "This doctor has already registered a login");
            }
        }

        User user = new User();
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        userMapper.insert(user); // REG-R9

        String patientCode = null;
        if (role.equals("PATIENT")) {
            Patient patient = new Patient();
            patient.setUserId(user.getId());
            patient.setDateOfBirth(request.dateOfBirth());
            patient.setGender(request.gender());
            patient.setAddress(request.address());
            patientMapper.insert(patient);

            patientCode = "PAT" + String.format("%06d", patient.getId());
            patientMapper.updatePatientCode(patient.getId(), patientCode);
        } else if (role.equals("DOCTOR")) { // REG-R13
            doctorMapper.linkUser(doctor.getId(), user.getId());
        }

        return new RegisterResponse(user.getId(), role, patientCode);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String role = request.role() == null ? "" : request.role().toUpperCase();
        if (!VALID_ROLES.contains(role)) { // LOG-R0
            throw new BusinessException(ErrorCode.REG_INVALID_ROLE, "role must be PATIENT, DOCTOR, PHARMACIST or ADMIN");
        }

        User user = userMapper.findByPhone(request.phone())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid phone or password")); // LOG-R1

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid phone or password");
        }
        // LOG-R1a: checked only after the password is verified, so a stranger can't use this to
        // find out which phones are registered under which role.
        if (!role.equals(user.getRole())) {
            throw new BusinessException(ErrorCode.AUTH_ROLE_MISMATCH, "This account is not registered as " + role);
        }
        if (!user.isActive()) { // LOG-R2
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_INACTIVE, "Account is inactive");
        }

        Long patientId = null;
        String patientCode = null;
        Long doctorId = null;
        if ("PATIENT".equals(user.getRole())) {
            Patient patient = patientMapper.findByUserId(user.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Patient record not found"));
            patientId = patient.getId();
            patientCode = patient.getPatientCode();
        } else if ("DOCTOR".equals(user.getRole())) {
            Doctor doctor = doctorMapper.findByUserId(user.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Doctor record not found"));
            if (!doctor.isActive()) { // LOG-R2
                throw new BusinessException(ErrorCode.AUTH_ACCOUNT_INACTIVE, "Account is inactive");
            }
            doctorId = doctor.getId();
        }

        userMapper.updateLastLogin(user.getId());

        String token = jwtService.generateToken(user.getId(), user.getRole(), user.getFullName(), patientId, patientCode, doctorId);
        UserSummary summary = new UserSummary(user.getId(), user.getFullName(), user.getRole(), patientId, patientCode, doctorId);
        return new LoginResponse(token, jwtService.getExpirationSeconds(), summary);
    }

    public UserSummary me(AuthenticatedUser principal) {
        return new UserSummary(principal.id(), principal.name(), principal.role(), principal.patientId(),
                principal.patientCode(), principal.doctorId());
    }
}
