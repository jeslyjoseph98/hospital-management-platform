package com.hms.notification.service;

import com.hms.common.exception.BusinessException;
import com.hms.common.exception.ErrorCode;
import com.hms.common.web.PagedResponse;
import com.hms.notification.dto.NotificationResponse;
import com.hms.notification.mapper.NotificationMapper;
import com.hms.notification.model.Notification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationMapper notificationMapper) {
        this.notificationMapper = notificationMapper;
    }

    /**
     * NTF-R1: inserted only after the appointment insert succeeds, in the same transaction as the caller
     * (spec_details/03 §3 step 9) — this method carries no @Transactional of its own so it joins the
     * booking service's transaction.
     */
    public void notifyBookingSuccess(Long patientId, Long appointmentId, String title, String message) {
        Notification notification = new Notification();
        notification.setPatientId(patientId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setAppointmentId(appointmentId);
        notificationMapper.insert(notification);
    }

    public PagedResponse<NotificationResponse> listMy(Long patientId, boolean unreadOnly, int page, int size) {
        int offset = page * size;
        var notifications = notificationMapper.findByPatient(patientId, unreadOnly, offset, size).stream()
                .map(this::toResponse)
                .toList();
        long total = notificationMapper.countByPatient(patientId, unreadOnly);
        return PagedResponse.of(notifications, page, size, total);
    }

    public int unreadCount(Long patientId) {
        return notificationMapper.countUnread(patientId);
    }

    @Transactional
    public void markRead(Long notificationId, Long patientId) {
        notificationMapper.findByIdAndPatient(notificationId, patientId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NTF_NOT_FOUND, "Notification not found"));
        notificationMapper.markRead(notificationId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.getAppointmentId(),
                n.isRead(), n.getCreatedAt());
    }
}
