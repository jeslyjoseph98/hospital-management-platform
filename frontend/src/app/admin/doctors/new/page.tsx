"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { TimingsEditor } from "@/components/TimingsEditor";
import { createAdminDoctor, listAdminDepartments } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminDepartment, FieldError, TimingInput } from "@/lib/api/types";

export default function NewDoctorPage() {
  return (
    <RequireAdmin>
      <NewDoctorForm />
    </RequireAdmin>
  );
}

function NewDoctorForm() {
  const { token } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [form, setForm] = useState({
    departmentId: "",
    fullName: "",
    qualification: "",
    specialization: "",
    registrationNumber: "",
    experienceYears: "",
    phone: "",
    email: "",
    about: "",
    consultationFee: "",
    dailyLimit: "50",
  });
  const [timings, setTimings] = useState<TimingInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    listAdminDepartments(token).then((depts) => setDepartments(depts.filter((d) => d.active))).catch(() => {});
  }, [token]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((fe) => fe.filter((e) => e.field !== key));
  }

  function errorFor(field: string) {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function fieldClass(field: string) {
    return errorFor(field) ? "field-input w-full has-error" : "field-input w-full";
  }

  async function onSubmit() {
    if (!token) return;
    setError(null);
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const doctor = await createAdminDoctor(token, {
        departmentId: Number(form.departmentId),
        fullName: form.fullName,
        qualification: form.qualification,
        specialization: form.specialization,
        registrationNumber: form.registrationNumber,
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        about: form.about || undefined,
        consultationFee: Number(form.consultationFee),
        dailyLimit: form.dailyLimit ? Number(form.dailyLimit) : undefined,
        timings,
      });
      router.push(`/admin/doctors/${doctor.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors ?? []);
      } else {
        setError("Failed to create doctor");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Add doctor</h1>
      <p className="mb-6 text-slate-500">Profile, consultation details and weekly timings.</p>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      <div className="card mb-6 px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Department" error={errorFor("departmentId")}>
            <select className={fieldClass("departmentId")} value={form.departmentId} onChange={(e) => update("departmentId", e.target.value)}>
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.deptName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Full name" error={errorFor("fullName")}>
            <input className={fieldClass("fullName")} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </Field>
          <Field label="Qualification" error={errorFor("qualification")}>
            <input className={fieldClass("qualification")} value={form.qualification} onChange={(e) => update("qualification", e.target.value)} />
          </Field>
          <Field label="Specialization" error={errorFor("specialization")}>
            <input className={fieldClass("specialization")} value={form.specialization} onChange={(e) => update("specialization", e.target.value)} />
          </Field>
          <Field label="Registration number" error={errorFor("registrationNumber")}>
            <input className={fieldClass("registrationNumber")} value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
          </Field>
          <Field label="Experience (years)" error={errorFor("experienceYears")}>
            <input type="number" min={0} max={70} className={fieldClass("experienceYears")} value={form.experienceYears} onChange={(e) => update("experienceYears", e.target.value)} />
          </Field>
          <Field label="Phone" error={errorFor("phone")}>
            <input className={fieldClass("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Email" error={errorFor("email")}>
            <input type="email" className={fieldClass("email")} value={form.email} onChange={(e) => update("email", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="About" error={errorFor("about")}>
              <textarea className={fieldClass("about")} rows={2} value={form.about} onChange={(e) => update("about", e.target.value)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card mb-6 px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Consultation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Consultation fee (₹)" error={errorFor("consultationFee")}>
            <input type="number" min={0} step="0.01" className={fieldClass("consultationFee")} value={form.consultationFee} onChange={(e) => update("consultationFee", e.target.value)} />
          </Field>
          <Field label="Daily appointment limit" error={errorFor("dailyLimit")}>
            <input type="number" min={1} max={200} className={fieldClass("dailyLimit")} value={form.dailyLimit} onChange={(e) => update("dailyLimit", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card mb-6 px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Weekly timings</h2>
        <TimingsEditor value={timings} onChange={setTimings} />
      </div>

      <button onClick={onSubmit} disabled={submitting} className="btn-primary px-6 py-2.5 text-base">
        {submitting ? "Creating…" : "Create doctor"}
      </button>
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
