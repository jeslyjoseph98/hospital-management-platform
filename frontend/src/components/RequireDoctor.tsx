"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { homeFor, useAuth } from "@/lib/auth/AuthContext";

/** UI-R1 / UI-R3: no token → /login; wrong role → own home. */
export function RequireDoctor({ children }: { children: ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "DOCTOR") {
      router.replace(homeFor(user?.role));
    }
  }, [isLoading, token, user, router]);

  if (isLoading || !token || user?.role !== "DOCTOR") {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return <>{children}</>;
}
