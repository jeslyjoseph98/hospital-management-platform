"use client";

import { useEffect, useState } from "react";
import { listMyNotifications, markNotificationRead } from "@/lib/api/notifications";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { NotificationItem } from "@/lib/api/types";

export default function NotificationsPage() {
  return <NotificationsList />;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationsList() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!token) return;
    listMyNotifications(token)
      .then((page) => setNotifications(page.content))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load notifications"));
  }

  useEffect(load, [token]);

  async function onOpen(n: NotificationItem) {
    if (n.isRead || !token) return;
    setNotifications((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? prev);
    try {
      await markNotificationRead(token, n.id);
    } catch {
      // best-effort; a background refresh will reconcile
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Notifications</h1>
      <p className="mb-6 text-slate-500">Booking confirmations and updates.</p>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {!notifications && !error && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-violet-50/60" />
          ))}
        </div>
      )}

      {notifications?.length === 0 && (
        <div className="card px-6 py-10 text-center">
          <p className="mb-2 text-3xl">🔔</p>
          <p className="text-slate-600">Nothing here yet — book an appointment to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications?.map((n) => (
          <button
            key={n.id}
            onClick={() => onOpen(n)}
            className={`card block w-full px-5 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
              n.isRead ? "opacity-70" : "ring-2 ring-violet-300"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-bold text-slate-900">
                {!n.isRead && <span className="h-2 w-2 rounded-full bg-fuchsia-500" />}
                {n.title}
              </p>
              <span className="shrink-0 text-xs font-medium text-slate-400">{timeAgo(n.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-600">{n.message}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
