import { apiFetch } from "./client";
import type { NotificationItem, PagedResponse } from "./types";

export function listMyNotifications(token: string, unreadOnly = false) {
  return apiFetch<PagedResponse<NotificationItem>>("/notifications/my", {
    token,
    query: { unreadOnly, page: 0, size: 20 },
  });
}

export function getUnreadCount(token: string) {
  return apiFetch<number>("/notifications/my/unread-count", { token });
}

export function markNotificationRead(token: string, id: number) {
  return apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH", token });
}
