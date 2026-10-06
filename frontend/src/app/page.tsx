"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useAuth } from "@/lib/auth/AuthContext";

/** UI-R1 / UI-R4: send the visitor to /login, or straight home if already signed in. */
export default function RootPage() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(token ? homeFor(user?.role) : "/login");
  }, [isLoading, token, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  );
}
