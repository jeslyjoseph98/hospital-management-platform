"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTodayAppointments } from "@/lib/api/doctor";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { TodayAppointments } from "@/lib/api/types";

const STATUS_BADGE: Record<string, string> = {
  BOOKED: "badge-available",
  IN_PROGRESS: "badge-not-available",
  COMPLETED: "badge-available",
};

export default function DoctorTodayPage() {
  const { token } = useAuth();
  const [data, setData] = useState<TodayAppointments | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getTodayAppointments(token)
      .then(setData)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load today's appointments"));
  }, [token]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Today&apos;s appointments</h1>
        <p className="text-slate-500">{data?.date}</p>
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {data && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:max-w-md">
          <div className="card px-4 py-3 text-center">
            <p className="text-2xl font-black text-slate-900">{data.total}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
          </div>
          <div className="card px-4 py-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{data.completed}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          </div>
          <div className="card px-4 py-3 text-center">
            <p className="text-2xl font-black text-amber-600">{data.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Reporting time</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Age / Gender</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.appointments.map((apt) => (
              <tr key={apt.appointmentId}>
                <td className="px-4 py-3 font-semibold text-slate-800">{apt.tokenNumber}</td>
                <td className="px-4 py-3 text-slate-600">{apt.reportingTime.slice(0, 5)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{apt.patientName}</p>
                  <p className="text-xs text-slate-500">{apt.patientCode}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {apt.age} / {apt.gender}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[apt.status] ?? "badge-available"}`}>{apt.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/doctor/appointments/${apt.appointmentId}`}
                    className="text-sm font-semibold text-violet-600 hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.appointments.length === 0 && (
          <p className="px-4 py-6 text-center text-slate-500">No appointments today.</p>
        )}
      </div>
    </div>
  );
}
