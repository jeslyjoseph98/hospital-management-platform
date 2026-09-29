package com.hms.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Auth / patient (spec_details/01)
    PAT_PHONE_INVALID(HttpStatus.BAD_REQUEST),
    PAT_PHONE_EXISTS(HttpStatus.CONFLICT),
    PAT_EMAIL_EXISTS(HttpStatus.CONFLICT),
    PAT_DOB_INVALID(HttpStatus.BAD_REQUEST),
    PAT_WEAK_PASSWORD(HttpStatus.BAD_REQUEST),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    AUTH_ACCOUNT_INACTIVE(HttpStatus.UNAUTHORIZED),

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
    NTF_NOT_FOUND(HttpStatus.NOT_FOUND);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
