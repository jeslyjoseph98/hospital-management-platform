"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { TimingsEditor } from "@/components/TimingsEditor";
import {
  getAdminDoctor,
  getAdminDoctorBookings,
  listAdminDepartments,
  replaceAdminDoctorTimings,
  updateAdminDoctor,
  updateAdminDoctorStatus,
} from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminDepartment, AdminDoctor, AffectedDate, DoctorBookings, FieldError, TimingInput } from "@/lib/api/types";

export default function AdminDoctorDetailPage() {
  return (
    <RequireAdmin>
      <DoctorDetail />
    </RequireAdmin>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function DoctorDetail() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const doctorId = Number(params.id);

  const [doctor, setDoctor] = useState<AdminDoctor | null>(null);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [form, setForm] = useState<Record<string, string> | null>(null);
  const [timings, setTimings] = useState<TimingInput[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileAffected, setProfileAffected] = useState<AffectedDate[] | null>(null);
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldError[]>([]);
  const [timingsError, setTimingsError] = useState<string | null>(null);
  const [timingsAffected, setTimingsAffected] = useState<AffectedDate[] | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusAffected, setStatusAffected] = useState<AffectedDate[] | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTimings, setSavingTimings] = useState(false);

  const [bookingDate, setBookingDate] = useState(todayIso());
  const [bookings, setBookings] = useState<DoctorBookings | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  function load() {
    if (!token) return;
    getAdminDoctor(token, doctorId).then((d) => {
      setDoctor(d);
      setForm({
        departmentId: String(d.departmentId),
        fullName: d.fullName,
        qualification: d.qualification,
        specialization: d.specialization,
        registrationNumber: d.registrationNumber,
        experienceYears: String(d.experienceYears),
        phone: d.phone ?? "",
        email: d.email ?? "",
        about: d.about ?? "",
        consultationFee: String(d.consultationFee),
        dailyLimit: String(d.dailyLimit),
      });
      setTimings(d.timings.map((t) => ({ dayOfWeek: t.dayOfWeek, startTime: t.startTime, endTime: t.endTime })));
    });
    listAdminDepartments(token).then(setDepartments).catch(() => {});
  }

  useEffect(load, [token, doctorId]);

  useEffect(() => {
    if (!token) return;
    setBookingsError(null);
    getAdminDoctorBookings(token, doctorId, bookingDate)
      .then(setBookings)
      .catch((err) => setBookingsError(err instanceof ApiClientError ? err.message : "Failed to load bookings"));
  }, [token, doctorId, bookingDate]);

  if (!doctor || !form) {
    return <p className="text-slate-500">Loading…</p>;
  }

  function update(key: string, val: string) {
    setForm((f) => (f ? { ...f, [key]: val } : f));
    setProfileFieldErrors((fe) => fe.filter((e) => e.field !== key));
  }

  function errorFor(field: string) {
    return profileFieldErrors.find((e) => e.field === field)?.message;
  }

  function fieldClass(field: string) {
    return errorFor(field) ? "field-input w-full has-error" : "field-input w-full";
  }

  async function saveProfile() {
    if (!token || !form) return;
    setProfileError(null);
    setProfileAffected(null);
    setProfileFieldErrors([]);
    setSavingProfile(true);
    try {
      const updated = await updateAdminDoctor(token, doctorId, {
        departmentId: Number(form.departmentId),
        fullName: form.fullName,
        qualification: form.qualification,
        specialization: form.specialization,
        registrationNumber: form.registrationNumber,
        experienceYears: Number(form.experienceYears),
        phone: form.phone || undefined,
        email: form.email || undefined,
        about: form.about || undefined,
        consultationFee: Number(form.consultationFee),
        dailyLimit: Number(form.dailyLimit),
      });
      setDoctor(updated);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setProfileError(err.message);
        setProfileFieldErrors(err.fieldErrors ?? []);
        if (err.data && typeof err.data === "object" && "affected" in err.data) {
          setProfileAffected((err.data as { affected: AffectedDate[] }).affected);
        }
      } else {
        setProfileError("Failed to save profile");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveTimings() {
    if (!token) return;
    setTimingsError(null);
    setTimingsAffected(null);
    setSavingTimings(true);
    try {
      const updated = await replaceAdminDoctorTimings(token, doctorId, timings);
      setDoctor(updated);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setTimingsError(err.message);
        if (err.data && typeof err.data === "object" && "affected" in err.data) {
          setTimingsAffected((err.data as { affected: AffectedDate[] }).affected);
        }
      } else {
        setTimingsError("Failed to save timings");
      }
    } finally {
      setSavingTimings(false);
    }
  }

  async function toggleStatus() {
    if (!token || !doctor) return;
    setStatusError(null);
    setStatusAffected(null);
    try {
      const updated = await updateAdminDoctorStatus(token, doctorId, !doctor.active);
      setDoctor(updated);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setStatusError(err.message);
        if (err.data && typeof err.data === "object" && "affected" in err.data) {
          setStatusAffected((err.data as { affected: AffectedDate[] }).affected);
        }
      } else {
        setStatusError("Failed to update status");
      }
    }
  }

  return (
    <div>
      <Link href="/admin/doctors" className="mb-2 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← Doctors
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{doctor.fullName}</h1>
          <p className="text-slate-500">{doctor.departmentName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${doctor.active ? "badge-available" : "badge-not-available"}`}>
            {doctor.active ? "Active" : "Inactive"}
          </span>
          <button onClick={toggleStatus} className="btn-secondary px-4 py-2 text-sm">
            {doctor.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
      {statusError && <ErrorWithAffected message={statusError} affected={statusAffected} />}

      <div className="card mb-6 px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Profile & consultation</h2>
        {profileError && <ErrorWithAffected message={profileError} affected={profileAffected} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Department" error={errorFor("departmentId")}>
            <select className={fieldClass("departmentId")} value={form.departmentId} onChange={(e) => update("departmentId", e.target.value)}>
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
          <Field label="Consultation fee (₹)" error={errorFor("consultationFee")}>
            <input type="number" min={0} step="0.01" className={fieldClass("consultationFee")} value={form.consultationFee} onChange={(e) => update("consultationFee", e.target.value)} />
          </Field>
          <Field label="Daily appointment limit" error={errorFor("dailyLimit")}>
            <input type="number" min={1} max={200} className={fieldClass("dailyLimit")} value={form.dailyLimit} onChange={(e) => update("dailyLimit", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="About" error={errorFor("about")}>
              <textarea className={fieldClass("about")} rows={2} value={form.about} onChange={(e) => update("about", e.target.value)} />
            </Field>
          </div>
        </div>
        <button onClick={saveProfile} disabled={savingProfile} className="btn-primary mt-4 px-5 py-2 text-sm">
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </div>

      <div className="card mb-6 px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Weekly timings</h2>
        {timingsError && <ErrorWithAffected message={timingsError} affected={timingsAffected} />}
        <TimingsEditor value={timings} onChange={setTimings} />
        <button onClick={saveTimings} disabled={savingTimings} className="btn-primary mt-4 px-5 py-2 text-sm">
          {savingTimings ? "Saving…" : "Save timings"}
        </button>
      </div>

      <div className="card px-5 py-5">
        <h2 className="mb-3 font-bold text-slate-800">Bookings</h2>
        <input
          type="date"
          className="field-input mb-4"
          value={bookingDate}
          onChange={(e) => setBookingDate(e.target.value)}
        />
        {bookingsError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {bookingsError}</p>}
        {bookings && (
          <>
            <p className="mb-3 text-sm font-semibold text-slate-600">
              {bookings.booked} / {bookings.dailyLimit} booked
            </p>
            {bookings.tokens.length === 0 ? (
              <p className="text-sm text-slate-500">No bookings for this date.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-1.5 pr-3">Token</th>
                    <th className="py-1.5 pr-3">Patient</th>
                    <th className="py-1.5 pr-3">Code</th>
                    <th className="py-1.5 pr-3">Reporting time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.tokens.map((t) => (
                    <tr key={t.tokenNumber}>
                      <td className="py-1.5 pr-3 font-semibold text-slate-800">{t.tokenNumber}</td>
                      <td className="py-1.5 pr-3">{t.patientName}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{t.patientCode}</td>
                      <td className="py-1.5 pr-3">{t.reportingTime.slice(0, 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
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

function ErrorWithAffected({
  message,
  affected,
}: {
  message: string;
  affected: AffectedDate[] | null;
}) {
  return (
    <div className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p>⚠️ {message}</p>
      {affected && affected.length > 0 && (
        <ul className="mt-2 list-inside list-disc">
          {affected.map((a) => (
            <li key={a.date}>
              {a.date}: {a.booked} booked
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
