"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { me as fetchMe } from "@/lib/api/auth";
import { TOKEN_STORAGE_KEY as STORAGE_KEY } from "@/lib/auth/storage";
import type { UserSummary } from "@/lib/api/types";

export function homeFor(role: UserSummary["role"] | undefined) {
  if (role === "ADMIN") return "/admin/doctors";
  if (role === "DOCTOR") return "/doctor/today";
  if (role === "PHARMACIST") return "/pharmacy/prescriptions";
  return "/patient/book-appointment";
}

interface AuthContextValue {
  token: string | null;
  user: UserSummary | null;
  isLoading: boolean;
  login: (token: string, user: UserSummary) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    // UI-R5 / restoring a session on refresh: ask the backend who this token belongs to
    // rather than trusting a cached user object — catches expired/deactivated accounts too.
    fetchMe(storedToken)
      .then((freshUser) => {
        setToken(storedToken);
        setUser(freshUser);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      login: (newToken, newUser) => {
        window.localStorage.setItem(STORAGE_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
