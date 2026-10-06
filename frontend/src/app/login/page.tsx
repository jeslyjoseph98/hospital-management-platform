"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as loginRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { homeFor, useAuth } from "@/lib/auth/AuthContext";
import type { Role } from "@/lib/api/types";

export default function LoginPage() {
  const { token, user, isLoading, login } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<Role>("PATIENT");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // UI-R4: already signed in → own home.
  useEffect(() => {
    if (!isLoading && token) {
      router.replace(homeFor(user?.role));
    }
  }, [isLoading, token, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await loginRequest(role, phone.trim(), password);
      login(res.accessToken, res.user);
      router.replace(homeFor(res.user.role));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to log in");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || token) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md px-8 py-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-4xl">🏥</p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              HMS Booking
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Login as</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="field-input w-full">
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9845012345"
              className="field-input w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field-input w-full"
            />
          </div>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-2.5 text-sm">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-violet-700 hover:text-violet-900">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
