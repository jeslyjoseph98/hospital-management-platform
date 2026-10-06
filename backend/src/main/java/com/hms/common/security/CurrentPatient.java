package com.hms.common.security;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentPatient {

    private CurrentPatient() {
    }

    /** Every booking API takes the patient id from the token, never from the request body (LOG-R5). */
    public static AuthenticatedUser get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedUser user) || !user.isPatient()) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        return user;
    }

    /** patients.id (not users.id) — the JWT's patientId claim. */
    public static Long id() {
        return get().patientId();
    }

    public static Long userId() {
        return get().id();
    }
}
