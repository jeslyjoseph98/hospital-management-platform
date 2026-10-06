"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAppointment, getAppointmentConsultation } from "@/lib/api/appointments";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AppointmentSummary, PatientConsultationView } from "@/lib/api/types";

export default function PatientAppointmentPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const appointmentId = Number(params.id);

  const [appointment, setAppointment] = useState<AppointmentSummary | null>(null);
  const [consultation, setConsultation] = useState<PatientConsultationView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getAppointment(token, appointmentId)
      .then(setAppointment)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load appointment"));
  }, [token, appointmentId]);

  useEffect(() => {
    if (!token || appointment?.status !== "COMPLETED") return;
    getAppointmentConsultation(token, appointmentId)
      .then(setConsultation)
      .catch(() => {});
  }, [token, appointmentId, appointment?.status]);

  if (!appointment) {
    return (
      <div>
        <Link href="/patient/appointments" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
          ← My appointments
        </Link>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
        {!error && <p className="text-slate-500">Loading…</p>}
      </div>
    );
  }

  return (
    <div>
      <Link href="/patient/appointments" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← My appointments
      </Link>

      <div className="card mb-6 px-6 py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold text-slate-900">{appointment.doctorName}</h1>
          <span className="badge badge-available">{appointment.status}</span>
        </div>
        <p className="text-slate-500">{appointment.departmentName} · {appointment.appointmentCode}</p>
        <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-500">Date</dt><dd>{appointment.appointmentDate}</dd></div>
          <div><dt className="font-semibold text-slate-500">Token</dt><dd>{appointment.tokenNumber}</dd></div>
          <div><dt className="font-semibold text-slate-500">Reporting time</dt><dd>{appointment.reportingTime.slice(0, 5)}</dd></div>
        </dl>
      </div>

      {appointment.status === "COMPLETED" && (
        <div className="card px-6 py-6">
          <h2 className="mb-3 text-lg font-bold text-slate-800">Consultation summary</h2>
          {!consultation && <p className="text-slate-500">Loading…</p>}
          {consultation && (
            <>
              <p className="text-sm text-slate-500">
                {consultation.date} with {consultation.doctorName}
              </p>
              {consultation.diagnosis && (
                <p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Diagnosis:</span> {consultation.diagnosis}</p>
              )}
              {consultation.advice && (
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Advice:</span> {consultation.advice}</p>
              )}
              {consultation.followUpDate && (
                <p className="mt-1 text-sm text-slate-700"><span className="font-semibold">Follow-up:</span> {consultation.followUpDate}</p>
              )}

              {(consultation.temperatureC || consultation.pulseBpm || consultation.bpSystolic || consultation.weightKg) && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {consultation.temperatureC && (
                    <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                      <p className="text-lg font-bold text-slate-900">{consultation.temperatureC}°C</p>
                      <p className="text-xs text-slate-500">Temperature</p>
                    </div>
                  )}
                  {consultation.pulseBpm && (
                    <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                      <p className="text-lg font-bold text-slate-900">{consultation.pulseBpm}</p>
                      <p className="text-xs text-slate-500">Pulse (bpm)</p>
                    </div>
                  )}
                  {consultation.bpSystolic && consultation.bpDiastolic && (
                    <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                      <p className="text-lg font-bold text-slate-900">{consultation.bpSystolic}/{consultation.bpDiastolic}</p>
                      <p className="text-xs text-slate-500">BP</p>
                    </div>
                  )}
                  {consultation.weightKg && (
                    <div className="rounded-xl bg-violet-50 px-3 py-2 text-center">
                      <p className="text-lg font-bold text-slate-900">{consultation.weightKg} kg</p>
                      <p className="text-xs text-slate-500">Weight</p>
                    </div>
                  )}
                </div>
              )}

              {consultation.prescription.length > 0 && (
                <>
                  <h3 className="mb-2 mt-5 font-bold text-slate-800">Prescription</h3>
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-1 pr-3">Medicine</th>
                        <th className="py-1 pr-3">Dosage</th>
                        <th className="py-1 pr-3">Timing</th>
                        <th className="py-1 pr-3">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consultation.prescription.map((item, i) => (
                        <tr key={i}>
                          <td className="py-1 pr-3">{item.medicineName}{item.strength ? ` (${item.strength})` : ""}</td>
                          <td className="py-1 pr-3">{item.dosagePattern}</td>
                          <td className="py-1 pr-3">{item.timing.replace("_", " ")}</td>
                          <td className="py-1 pr-3">{item.durationDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {consultation.dispenseStatus === "DISPENSED" && (
                    <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      ✅ Medicines given on {consultation.dispensedAt?.replace("T", " ").slice(0, 16)}
                      {consultation.dispenseRemarks ? ` — ${consultation.dispenseRemarks}` : ""}
                    </p>
                  )}
                  {consultation.dispenseStatus === "PENDING" && (
                    <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                      ⏳ Medicines not yet collected
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
