package com.hms.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final String message;
    private final String errorCode;
    private final List<FieldError> fieldErrors;

    private ApiResponse(boolean success, T data, String message, String errorCode, List<FieldError> fieldErrors) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, null, null);
    }

    public static ApiResponse<Void> error(String errorCode, String message) {
        return new ApiResponse<>(false, null, message, errorCode, null);
    }

    public static ApiResponse<Void> error(String errorCode, String message, List<FieldError> fieldErrors) {
        return new ApiResponse<>(false, null, message, errorCode, fieldErrors);
    }

    /** For business conflicts that carry a payload alongside the error, e.g. `{ "affected": [...] }`. */
    public static <T> ApiResponse<T> errorWithData(String errorCode, String message, T data) {
        return new ApiResponse<>(false, data, message, errorCode, null);
    }

    public record FieldError(String field, String message) {
    }
}
