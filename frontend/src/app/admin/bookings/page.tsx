"use client";

import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { getAdminDoctorBookings, listAdminDepartments, listAdminDoctors } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminDepartment, AdminDoctorSummary, DoctorBookings } from "@/lib/api/types";

export default function AdminBookingsPage() {
  return (
    <RequireAdmin>
      <BookingsLookup />
    </RequireAdmin>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function BookingsLookup() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [doctors, setDoctors] = useState<AdminDoctorSummary[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [bookings, setBookings] = useState<DoctorBookings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listAdminDepartments(token).then(setDepartments).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    listAdminDoctors(token, { departmentId: departmentId ? Number(departmentId) : undefined, size: 200 })
      .then((page) => {
        setDoctors(page.content);
        if (!page.content.some((d) => String(d.id) === doctorId)) {
          setDoctorId(page.content[0] ? String(page.content[0].id) : "");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, departmentId]);

  useEffect(() => {
    if (!token || !doctorId) {
      setBookings(null);
      return;
    }
    setError(null);
    getAdminDoctorBookings(token, Number(doctorId), date)
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load bookings"));
  }, [token, doctorId, date]);

  const selectedDoctor = doctors.find((d) => String(d.id) === doctorId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Bookings</h1>
        <p className="text-slate-500">Pick a doctor and date to see booked count and tokens.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <select className="field-input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.deptName}
            </option>
          ))}
        </select>
        <select className="field-input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          {doctors.length === 0 && <option value="">No doctors</option>}
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} — {d.departmentName}
            </option>
          ))}
        </select>
        <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {!selectedDoctor && !error && <p className="text-slate-500">Select a doctor to view bookings.</p>}

      {bookings && selectedDoctor && (
        <div className="card px-5 py-5">
          <h2 className="mb-1 font-bold text-slate-800">{selectedDoctor.fullName}</h2>
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
        </div>
      )}
    </div>
  );
}
