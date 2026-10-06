package com.hms.common.security;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;

/** For endpoints reachable by any authenticated role, e.g. GET /auth/me. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static AuthenticatedUser get() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof AuthenticatedUser user)) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Not authenticated");
        }
        return user;
    }
}
