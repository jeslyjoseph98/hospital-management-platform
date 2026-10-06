package com.hms.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Common registration / login (spec_details/01)
    REG_INVALID_ROLE(HttpStatus.BAD_REQUEST),
    REG_PHONE_INVALID(HttpStatus.BAD_REQUEST),
    REG_PHONE_EXISTS(HttpStatus.CONFLICT),
    REG_EMAIL_EXISTS(HttpStatus.CONFLICT),
    REG_WEAK_PASSWORD(HttpStatus.BAD_REQUEST),
    REG_DOB_INVALID(HttpStatus.BAD_REQUEST),
    REG_ADMIN_CODE_INVALID(HttpStatus.BAD_REQUEST),
    REG_DOCTOR_NOT_FOUND(HttpStatus.BAD_REQUEST),
    REG_DOCTOR_PHONE_MISMATCH(HttpStatus.BAD_REQUEST),
    REG_DOCTOR_ALREADY_REGISTERED(HttpStatus.CONFLICT),
    REG_STAFF_CODE_INVALID(HttpStatus.BAD_REQUEST),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    AUTH_ACCOUNT_INACTIVE(HttpStatus.UNAUTHORIZED),
    AUTH_ROLE_MISMATCH(HttpStatus.UNAUTHORIZED),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN),

    // Departments / doctors / availability (spec_details/02)
    DOC_DEPARTMENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    DOC_NOT_FOUND(HttpStatus.NOT_FOUND),

    // Appointment booking (spec_details/03)
    APT_DATE_OUT_OF_RANGE(HttpStatus.BAD_REQUEST),
    APT_DOCTOR_NOT_AVAILABLE(HttpStatus.CONFLICT),
    APT_BOOKING_CLOSED(HttpStatus.CONFLICT),
    APT_ALREADY_BOOKED(HttpStatus.CONFLICT),
    APT_DOCTOR_FULLY_BOOKED(HttpStatus.CONFLICT),
    APT_NOT_FOUND(HttpStatus.NOT_FOUND),

    // Notifications (spec_details/04)
    NTF_NOT_FOUND(HttpStatus.NOT_FOUND),

    // Admin: departments (spec_details/05)
    ADM_DEPARTMENT_EXISTS(HttpStatus.CONFLICT),
    ADM_DEPARTMENT_HAS_DOCTORS(HttpStatus.CONFLICT),
    ADM_DEPARTMENT_INACTIVE(HttpStatus.CONFLICT),

    // Admin: doctors (spec_details/05)
    ADM_DOCTOR_REG_EXISTS(HttpStatus.CONFLICT),
    ADM_DOCTOR_INVALID(HttpStatus.BAD_REQUEST),
    ADM_LIMIT_BELOW_BOOKED(HttpStatus.CONFLICT),
    ADM_DOCTOR_HAS_BOOKINGS(HttpStatus.CONFLICT),

    // Admin: weekly timings (spec_details/05)
    ADM_DUPLICATE_DAY(HttpStatus.BAD_REQUEST),
    ADM_INVALID_TIME(HttpStatus.BAD_REQUEST),
    ADM_WINDOW_TOO_SHORT(HttpStatus.BAD_REQUEST),
    ADM_DAY_HAS_BOOKINGS(HttpStatus.CONFLICT),

    // Doctor portal: today's appointments / patient details (spec_details/06)
    DRP_PATIENT_NOT_FOUND(HttpStatus.NOT_FOUND),
    DRP_NOT_YOUR_APPOINTMENT(HttpStatus.FORBIDDEN),
    DRP_NOT_TODAY(HttpStatus.CONFLICT),
    DRP_ALREADY_COMPLETED(HttpStatus.CONFLICT),
    DRP_VITALS_INVALID(HttpStatus.BAD_REQUEST),
    DRP_FOLLOWUP_INVALID(HttpStatus.BAD_REQUEST),
    DRP_TOO_MANY_ITEMS(HttpStatus.BAD_REQUEST),
    DRP_DOSAGE_INVALID(HttpStatus.BAD_REQUEST),
    DRP_DIAGNOSIS_REQUIRED(HttpStatus.BAD_REQUEST),

    // Pharmacy: dispensing (spec_details/07)
    PHR_NOT_FOUND(HttpStatus.NOT_FOUND),
    PHR_ALREADY_DISPENSED(HttpStatus.CONFLICT),
    PHR_NOTHING_TO_DISPENSE(HttpStatus.CONFLICT);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
