"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { listAdminDepartments, listAdminDoctors } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminDepartment, AdminDoctorSummary } from "@/lib/api/types";

export default function AdminDoctorsPage() {
  return (
    <RequireAdmin>
      <DoctorsManager />
    </RequireAdmin>
  );
}

function DoctorsManager() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<AdminDoctorSummary[] | null>(null);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [departmentId, setDepartmentId] = useState<string>("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listAdminDepartments(token).then(setDepartments).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    listAdminDoctors(token, { departmentId: departmentId ? Number(departmentId) : undefined, name: name || undefined })
      .then((page) => setDoctors(page.content))
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load doctors"));
  }, [token, departmentId, name]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Doctors</h1>
          <p className="text-slate-500">Manage doctor profiles, fees and weekly timings.</p>
        </div>
        <Link href="/admin/doctors/new" className="btn-primary px-4 py-2 text-sm">
          + New doctor
        </Link>
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
        <input
          className="field-input"
          placeholder="Search by name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
      {!doctors && !error && <p className="text-slate-500">Loading…</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Daily limit</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors?.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold text-slate-800">{d.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{d.departmentName}</td>
                <td className="px-4 py-3 text-slate-600">{d.specialization}</td>
                <td className="px-4 py-3 text-slate-600">₹{d.consultationFee}</td>
                <td className="px-4 py-3 text-slate-600">{d.dailyLimit}</td>
                <td className="px-4 py-3 text-slate-500">{d.days.join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${d.active ? "badge-available" : "badge-not-available"}`}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/doctors/${d.id}`} className="text-sm font-semibold text-violet-600 hover:underline">
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctors?.length === 0 && <p className="px-4 py-6 text-center text-slate-500">No doctors found.</p>}
      </div>
    </div>
  );
}
