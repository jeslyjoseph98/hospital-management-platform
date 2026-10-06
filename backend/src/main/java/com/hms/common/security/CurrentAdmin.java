package com.hms.common.security;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentAdmin {

    private CurrentAdmin() {
    }

    public static AuthenticatedUser get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedUser user) || !user.isAdmin()) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        return user;
    }

    /** users.id of the admin — stored as created_by/updated_by on departments/doctors/doctor_availability. */
    public static Long id() {
        return get().id();
    }
}
