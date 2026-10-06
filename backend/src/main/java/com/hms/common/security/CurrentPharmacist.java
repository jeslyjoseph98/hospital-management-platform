package com.hms.common.security;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentPharmacist {

    private CurrentPharmacist() {
    }

    public static AuthenticatedUser get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedUser user) || !user.isPharmacist()) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        return user;
    }

    /** users.id of the pharmacist — stored as dispensed_by on consultations. */
    public static Long id() {
        return get().id();
    }
}
