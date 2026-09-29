"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { listMyAppointments } from "@/lib/api/appointments";
import { ApiClientError } from "@/lib/api/client";
import { accentFor } from "@/lib/accentColors";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AppointmentSummary } from "@/lib/api/types";

export default function AppointmentsPage() {
  return (
    <RequireAuth>
      <AppointmentsList />
    </RequireAuth>
  );
}

function AppointmentsList() {
  const { token } = useAuth();
  const [upcoming, setUpcoming] = useState(true);
  const [appointments, setAppointments] = useState<AppointmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setAppointments(null);
    listMyAppointments(token, upcoming)
      .then(setAppointments)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load appointments"));
  }, [token, upcoming]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My appointments</h1>
          <p className="text-slate-500">Your booking history and upcoming visits.</p>
        </div>
        <Link href="/book" className="btn-primary hidden px-4 py-2 text-sm sm:block">
          + New booking
        </Link>
      </div>

      <div className="mb-5 inline-flex rounded-xl bg-violet-100/70 p-1">
        <button
          onClick={() => setUpcoming(true)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            upcoming ? "bg-white text-violet-700 shadow" : "text-violet-500"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setUpcoming(false)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            !upcoming ? "bg-white text-violet-700 shadow" : "text-violet-500"
          }`}
        >
          Past
        </button>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {!appointments && !error && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-violet-50/60" />
          ))}
        </div>
      )}

      {appointments?.length === 0 && (
        <div className="card px-6 py-10 text-center">
          <p className="mb-3 text-3xl">🗓️</p>
          <p className="mb-4 text-slate-600">
            {upcoming ? "No upcoming appointments yet." : "No past appointments."}
          </p>
          {upcoming && (
            <Link href="/book" className="btn-primary inline-block px-5 py-2 text-sm">
              Book your first appointment
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {appointments?.map((apt) => {
          const accent = accentFor(apt.id);
          return (
            <div
              key={apt.id}
              className={`card flex flex-wrap items-center justify-between gap-4 px-5 py-4 ring-1 ${accent.ring}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${accent.gradient} text-white shadow`}
                >
                  <span className="text-[10px] font-bold uppercase leading-none">Token</span>
                  <span className="text-lg font-black leading-none">{apt.tokenNumber}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{apt.doctorName}</p>
                  <p className="text-sm text-slate-500">
                    {apt.departmentName} · {apt.appointmentCode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">{apt.appointmentDate}</p>
                <p className="text-sm text-slate-500">Report by {apt.reportingTime.slice(0, 5)}</p>
              </div>
              <span className="badge badge-available">{apt.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
