"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PatientSummary } from "@/lib/api/types";

const STORAGE_KEY = "hms.auth";

interface StoredAuth {
  token: string;
  patient: PatientSummary;
}

interface AuthContextValue {
  token: string | null;
  patient: PatientSummary | null;
  isLoading: boolean;
  login: (auth: StoredAuth) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredAuth;
        setToken(parsed.token);
        setPatient(parsed.patient);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      patient,
      isLoading,
      login: (auth) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
        setToken(auth.token);
        setPatient(auth.patient);
      },
      logout: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setPatient(null);
      },
    }),
    [token, patient, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
