package com.hms.notification.controller;

import com.hms.common.security.CurrentPatient;
import com.hms.common.web.ApiResponse;
import com.hms.common.web.PagedResponse;
import com.hms.notification.dto.NotificationResponse;
import com.hms.notification.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    public ApiResponse<PagedResponse<NotificationResponse>> my(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notificationService.listMy(CurrentPatient.id(), unreadOnly, page, size));
    }

    @GetMapping("/my/unread-count")
    public ApiResponse<Integer> unreadCount() {
        return ApiResponse.ok(notificationService.unreadCount(CurrentPatient.id()));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id, CurrentPatient.id());
        return ApiResponse.ok(null);
    }
}
