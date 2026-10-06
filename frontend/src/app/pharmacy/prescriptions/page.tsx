"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPendingPrescriptions, searchPrescriptions } from "@/lib/api/pharmacy";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { PrescriptionListItem } from "@/lib/api/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const DISPENSE_BADGE: Record<string, string> = {
  PENDING: "badge-not-available",
  DISPENSED: "badge-available",
};

export default function PharmacyPrescriptionsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"pending" | "search">("pending");

  const [date, setDate] = useState(todayIso());
  const [pending, setPending] = useState<PrescriptionListItem[] | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PrescriptionListItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || tab !== "pending") return;
    setError(null);
    getPendingPrescriptions(token, date)
      .then(setPending)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load pending prescriptions"));
  }, [token, date, tab]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    setError(null);
    setSearching(true);
    try {
      setResults(await searchPrescriptions(token, query.trim()));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  const rows = tab === "pending" ? pending : results;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Prescriptions</h1>
        <p className="text-slate-500">Give medicines and mark prescriptions as done.</p>
      </div>

      <div className="mb-5 inline-flex rounded-xl bg-sky-100/70 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === "pending" ? "bg-white text-sky-700 shadow" : "text-sky-600"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setTab("search")}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === "search" ? "bg-white text-sky-700 shadow" : "text-sky-600"
          }`}
        >
          Search
        </button>
      </div>

      {tab === "pending" && (
        <div className="mb-5">
          <input type="date" className="field-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      )}

      {tab === "search" && (
        <form onSubmit={onSearch} className="mb-5 flex gap-2">
          <input
            className="field-input flex-1"
            placeholder="Patient code, phone, or appointment code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={searching} className="btn-primary px-5 py-2 text-sm">
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
      )}

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows?.map((r) => (
              <tr key={r.consultationId}>
                <td className="px-4 py-3 font-semibold text-slate-800">{r.tokenNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{r.patientName}</p>
                  <p className="text-xs text-slate-500">{r.patientCode}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.doctorName}
                  <p className="text-xs text-slate-500">{r.departmentName}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.completedAt.replace("T", " ").slice(0, 16)}</td>
                <td className="px-4 py-3 text-slate-600">{r.itemCount}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${DISPENSE_BADGE[r.dispenseStatus] ?? "badge-available"}`}>
                    {r.dispenseStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/pharmacy/prescriptions/${r.consultationId}`}
                    className="text-sm font-semibold text-violet-600 hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows?.length === 0 && (
          <p className="px-4 py-6 text-center text-slate-500">
            {tab === "pending" ? "No pending prescriptions for this date." : "No results."}
          </p>
        )}
        {!rows && tab === "search" && (
          <p className="px-4 py-6 text-center text-slate-500">Search by patient code, phone, or appointment code.</p>
        )}
      </div>
    </div>
  );
}
