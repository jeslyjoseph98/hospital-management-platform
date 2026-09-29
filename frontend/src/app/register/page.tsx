"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { register } from "@/lib/api/auth";
import { ApiClientError } from "@/lib/api/client";
import type { FieldError } from "@/lib/api/types";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    phone: "",
    email: "",
    password: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function fieldError(name: string) {
    return fieldErrors.find((f) => f.field === name)?.message;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const res = await register({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        address: form.address || undefined,
      });
      setSuccess(`Registration successful! Your patient code is ${res.patientCode}. Redirecting to login…`);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? []);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="card px-6 py-8 sm:px-10">
        <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">Register once, then book appointments anytime.</p>

        {success && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            ✅ {success}
          </p>
        )}
        {error && !success && (
          <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">⚠️ {error}</p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={fieldError("firstName")}>
              <input
                required
                className="field-input w-full"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </Field>
            <Field label="Last name">
              <input
                className="field-input w-full"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" error={fieldError("dateOfBirth")}>
              <input
                required
                type="date"
                className="field-input w-full"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
            </Field>
            <Field label="Gender" error={fieldError("gender")}>
              <select
                className="field-input w-full"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value as typeof form.gender)}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
          </div>

          <Field label="Phone (used to log in)" error={fieldError("phone")}>
            <input
              required
              maxLength={10}
              placeholder="9845012345"
              className="field-input w-full"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
            />
          </Field>

          <Field label="Email (optional)" error={fieldError("email")}>
            <input
              type="email"
              className="field-input w-full"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>

          <Field label="Password" error={fieldError("password")}>
            <input
              required
              type="password"
              placeholder="At least 8 characters, 1 letter & 1 digit"
              className="field-input w-full"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </Field>

          <Field label="Address (optional)">
            <input
              className="field-input w-full"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Field>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-base">
            {submitting ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}
