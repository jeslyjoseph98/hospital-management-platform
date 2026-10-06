"use client";

import { useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAdmin";
import { createAdminDepartment, listAdminDepartments, updateAdminDepartment, updateAdminDepartmentStatus } from "@/lib/api/admin";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { AdminDepartment } from "@/lib/api/types";

export default function AdminDepartmentsPage() {
  return (
    <RequireAdmin>
      <DepartmentsManager />
    </RequireAdmin>
  );
}

function DepartmentsManager() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<AdminDepartment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminDepartment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function load() {
    if (!token) return;
    listAdminDepartments(token)
      .then(setDepartments)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load departments"));
  }

  useEffect(load, [token]);

  async function toggleStatus(dept: AdminDepartment) {
    if (!token) return;
    setError(null);
    try {
      await updateAdminDepartmentStatus(token, dept.id, !dept.active);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to update status");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Departments</h1>
          <p className="text-slate-500">Add and manage hospital departments.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary px-4 py-2 text-sm">
          + New department
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {showCreate && (
        <DepartmentForm
          onCancel={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
      {editing && (
        <DepartmentForm
          department={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {!departments && <p className="text-slate-500">Loading…</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Active doctors</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments?.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold text-slate-800">{d.deptName}</td>
                <td className="px-4 py-3 text-slate-500">{d.description}</td>
                <td className="px-4 py-3 text-slate-600">{d.activeDoctorCount}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${d.active ? "badge-available" : "badge-not-available"}`}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(d)} className="mr-3 text-sm font-semibold text-violet-600 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(d)}
                    className="text-sm font-semibold text-slate-500 hover:underline"
                  >
                    {d.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentForm({
  department,
  onCancel,
  onSaved,
}: {
  department?: AdminDepartment;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [deptName, setDeptName] = useState(department?.deptName ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      if (department) {
        await updateAdminDepartment(token, department.id, deptName, description);
      } else {
        await createAdminDepartment(token, deptName, description);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save department");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card mb-6 px-5 py-5">
      <h2 className="mb-3 font-bold text-slate-800">{department ? "Edit department" : "New department"}</h2>
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Name</span>
          <input className="field-input w-full" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
          <input className="field-input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onSubmit} disabled={submitting} className="btn-primary px-4 py-2 text-sm">
          {submitting ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="btn-secondary px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}
