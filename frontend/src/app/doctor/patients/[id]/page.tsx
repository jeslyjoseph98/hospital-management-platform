"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDoctorPatient } from "@/lib/api/doctor";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PatientDetail } from "@/lib/api/types";

export default function DoctorPatientPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const patientId = Number(params.id);

  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getDoctorPatient(token, patientId)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load patient"));
  }, [token, patientId]);

  return (
    <div>
      <Link href="/doctor/today" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← Today
      </Link>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
      {!detail && !error && <p className="text-slate-500">Loading…</p>}

      {detail && (
        <>
          <div className="card mb-6 px-5 py-5">
            <h1 className="text-xl font-extrabold text-slate-900">{detail.patient.fullName}</h1>
            <p className="text-sm text-slate-500">{detail.patient.patientCode}</p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div className="flex justify-between sm:block"><dt className="font-semibold text-slate-500">Age / Gender</dt><dd>{detail.patient.age} / {detail.patient.gender}</dd></div>
              {detail.patient.phone && <div className="flex justify-between sm:block"><dt className="font-semibold text-slate-500">Phone</dt><dd>{detail.patient.phone}</dd></div>}
              {detail.patient.address && <div className="flex justify-between sm:block"><dt className="font-semibold text-slate-500">Address</dt><dd>{detail.patient.address}</dd></div>}
            </dl>
          </div>

          <h2 className="mb-3 text-lg font-bold text-slate-800">Visit history</h2>
          {detail.pastVisits.length === 0 && <p className="text-slate-500">No past visits.</p>}
          <div className="space-y-4">
            {detail.pastVisits.map((v, i) => (
              <div key={i} className="card px-5 py-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-slate-900">{v.date}</p>
                  <p className="text-sm text-slate-500">{v.doctorName} · {v.departmentName}</p>
                </div>
                {v.diagnosis && <p className="text-sm text-slate-700"><span className="font-semibold">Diagnosis:</span> {v.diagnosis}</p>}
                {v.advice && <p className="text-sm text-slate-700"><span className="font-semibold">Advice:</span> {v.advice}</p>}
                {v.doctorNotes && <p className="text-sm text-slate-500"><span className="font-semibold">Notes:</span> {v.doctorNotes}</p>}
                {v.prescription.length > 0 && (
                  <table className="mt-3 w-full text-left text-sm">
                    <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-1 pr-3">Medicine</th>
                        <th className="py-1 pr-3">Dosage</th>
                        <th className="py-1 pr-3">Timing</th>
                        <th className="py-1 pr-3">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {v.prescription.map((item, j) => (
                        <tr key={j}>
                          <td className="py-1 pr-3">{item.medicineName}{item.strength ? ` (${item.strength})` : ""}</td>
                          <td className="py-1 pr-3">{item.dosagePattern}</td>
                          <td className="py-1 pr-3">{item.timing.replace("_", " ")}</td>
                          <td className="py-1 pr-3">{item.durationDays}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {v.dispenseStatus === "DISPENSED" && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    ✅ Given on {v.dispensedAt?.replace("T", " ").slice(0, 16)}
                    {v.dispenseRemarks ? ` — ${v.dispenseRemarks}` : ""}
                  </p>
                )}
                {v.dispenseStatus === "PENDING" && (
                  <p className="mt-2 text-sm font-semibold text-amber-700">⏳ Medicines not yet collected</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
