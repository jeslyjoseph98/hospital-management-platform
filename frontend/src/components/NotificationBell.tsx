"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/lib/api/notifications";
import { useAuth } from "@/lib/auth/AuthContext";

export function NotificationBell() {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const load = () => {
      getUnreadCount(token)
        .then((c) => {
          if (!cancelled) setCount(c);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-violet-100 hover:ring-violet-300 transition"
      aria-label="Notifications"
    >
      <span role="img" aria-hidden="true" className="text-lg">
        🔔
      </span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 px-1 text-[11px] font-bold text-white shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
