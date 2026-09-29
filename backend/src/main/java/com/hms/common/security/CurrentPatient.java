package com.hms.common.security;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentPatient {

    private CurrentPatient() {
    }

    /** Every booking API takes the patient id from the token, never from the request body (PAT-R11). */
    public static AuthenticatedPatient get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedPatient patient)) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        return patient;
    }

    public static Long id() {
        return get().patientId();
    }
}
