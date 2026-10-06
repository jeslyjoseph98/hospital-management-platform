"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dispensePrescription, getPrescriptionDetail } from "@/lib/api/pharmacy";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PrescriptionDetail } from "@/lib/api/types";

export default function PrescriptionDetailPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const consultationId = Number(params.id);

  const [detail, setDetail] = useState<PrescriptionDetail | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dispensing, setDispensing] = useState(false);

  function load() {
    if (!token) return;
    getPrescriptionDetail(token, consultationId)
      .then((d) => {
        setDetail(d);
        setRemarks(d.dispenseRemarks ?? "");
      })
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load prescription"));
  }

  useEffect(load, [token, consultationId]);

  async function onDispense() {
    if (!token) return;
    if (!window.confirm("Mark this prescription as given? This cannot be undone.")) return;
    setError(null);
    setDispensing(true);
    try {
      const updated = await dispensePrescription(token, consultationId, remarks.trim() || undefined);
      setDetail(updated);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to mark as done");
    } finally {
      setDispensing(false);
    }
  }

  if (!detail) {
    return (
      <div>
        <Link href="/pharmacy/prescriptions" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
          ← Prescriptions
        </Link>
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
        {!error && <p className="text-slate-500">Loading…</p>}
      </div>
    );
  }

  const done = detail.dispenseStatus === "DISPENSED";

  return (
    <div>
      <Link href="/pharmacy/prescriptions" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← Prescriptions
      </Link>

      <div className="card mb-6 px-6 py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{detail.patient.name}</h1>
            <p className="text-sm text-slate-500">
              {detail.patient.patientCode} · {detail.patient.age} / {detail.patient.gender}
            </p>
          </div>
          <span className={`badge ${done ? "badge-available" : "badge-not-available"}`}>{detail.dispenseStatus}</span>
        </div>
        <dl className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <div><dt className="font-semibold text-slate-500">Doctor</dt><dd>{detail.doctorName}</dd></div>
          <div><dt className="font-semibold text-slate-500">Date</dt><dd>{detail.consultationDate}</dd></div>
          {detail.diagnosis && <div><dt className="font-semibold text-slate-500">Diagnosis</dt><dd>{detail.diagnosis}</dd></div>}
          {detail.followUpDate && <div><dt className="font-semibold text-slate-500">Follow-up</dt><dd>{detail.followUpDate}</dd></div>}
        </dl>
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      <div className="card px-6 py-6">
        <h2 className="mb-3 font-bold text-slate-800">Prescription</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1.5 pr-3">Medicine</th>
              <th className="py-1.5 pr-3">Dosage</th>
              <th className="py-1.5 pr-3">Timing</th>
              <th className="py-1.5 pr-3">Days</th>
              <th className="py-1.5 pr-3">Instructions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {detail.items.map((item, i) => (
              <tr key={i}>
                <td className="py-1.5 pr-3 font-semibold text-slate-800">
                  {item.medicineName}{item.strength ? ` (${item.strength})` : ""}
                </td>
                <td className="py-1.5 pr-3">{item.dosagePattern}</td>
                <td className="py-1.5 pr-3">{item.timing.replace("_", " ")}</td>
                <td className="py-1.5 pr-3">{item.durationDays}</td>
                <td className="py-1.5 pr-3 text-slate-500">{item.instructions ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-5">
          <label className="mb-1 block text-sm font-semibold text-slate-700">Remarks (optional)</label>
          <textarea
            disabled={done}
            rows={2}
            className="field-input w-full"
            placeholder="e.g. Cetirizine not available, advised to buy outside"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {done ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✅ Given on {detail.dispensedAt?.replace("T", " ").slice(0, 16)} by {detail.dispensedByName}
            {detail.dispenseRemarks ? ` — ${detail.dispenseRemarks}` : ""}
          </p>
        ) : (
          <button onClick={onDispense} disabled={dispensing} className="btn-primary mt-4 px-5 py-2 text-sm">
            {dispensing ? "Marking…" : "Mark as Done"}
          </button>
        )}
      </div>
    </div>
  );
}
