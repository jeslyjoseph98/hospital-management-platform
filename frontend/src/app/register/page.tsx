"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { register as registerRequest } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import { homeFor, useAuth } from "@/lib/auth/AuthContext";
import type { Role } from "@/lib/api/types";

const initialForm = {
  role: "PATIENT" as Role,
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
  address: "",
  adminCode: "",
  registrationNumber: "",
  staffCode: "",
};

export default function RegisterPage() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // UI-R4: already signed in → own home.
  useEffect(() => {
    if (!isLoading && token) {
      router.replace(homeFor(user?.role));
    }
  }, [isLoading, token, user, router]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    setSubmitting(true);
    try {
      await registerRequest({
        role: form.role,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        dateOfBirth: form.role === "PATIENT" ? form.dateOfBirth : undefined,
        gender: form.role === "PATIENT" ? form.gender : undefined,
        address: form.role === "PATIENT" ? form.address.trim() || undefined : undefined,
        adminCode: form.role === "ADMIN" ? form.adminCode.trim() : undefined,
        registrationNumber: form.role === "DOCTOR" ? form.registrationNumber.trim() : undefined,
        staffCode: form.role === "PHARMACIST" ? form.staffCode.trim() : undefined,
      });
      setSuccess("Registration successful. Please log in.");
      setForm(initialForm);
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const fieldMsg = err.fieldErrors?.[0]?.message;
        setError(fieldMsg ?? err.message);
      } else {
        setError("Failed to register");
      }
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
      <div className="card w-full max-w-lg px-8 py-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-4xl">🏥</p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              HMS Booking
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Create your account</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Register as</label>
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value as Role)}
              className="field-input w-full"
            >
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="field-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Phone</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="9845012345"
                className="field-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="field-input w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="min 8 chars, 1 letter, 1 digit"
                className="field-input w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm password</label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className="field-input w-full"
              />
            </div>
          </div>

          {form.role === "PATIENT" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Date of birth</label>
                  <input
                    type="date"
                    required
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    className="field-input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value as typeof form.gender)}
                    className="field-input w-full"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Address (optional)</label>
                <input
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  className="field-input w-full"
                />
              </div>
            </>
          )}

          {form.role === "DOCTOR" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Medical registration number</label>
              <input
                required
                value={form.registrationNumber}
                onChange={(e) => update("registrationNumber", e.target.value)}
                placeholder="Must match what the admin entered for you, e.g. KMC-45821"
                className="field-input w-full"
              />
            </div>
          )}

          {form.role === "PHARMACIST" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Staff registration code</label>
              <input
                required
                value={form.staffCode}
                onChange={(e) => update("staffCode", e.target.value)}
                className="field-input w-full"
              />
            </div>
          )}

          {form.role === "ADMIN" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Admin registration code</label>
              <input
                required
                value={form.adminCode}
                onChange={(e) => update("adminCode", e.target.value)}
                className="field-input w-full"
              />
            </div>
          )}

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
          {success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✅ {success}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full px-4 py-2.5 text-sm">
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-700 hover:text-violet-900">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
