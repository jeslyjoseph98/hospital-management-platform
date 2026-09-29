"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { listDepartments } from "@/lib/api/departments";
import { ApiClientError } from "@/lib/api/client";
import { accentFor } from "@/lib/accentColors";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Department } from "@/lib/api/types";

export default function BookDepartmentPage() {
  return (
    <RequireAuth>
      <DepartmentList />
    </RequireAuth>
  );
}

function DepartmentList() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listDepartments(token)
      .then(setDepartments)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load departments"));
  }, [token]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Choose a department</h1>
      <p className="mb-6 text-slate-500">Step 1 of 3 — pick the area of care you need.</p>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {!departments && !error && <SkeletonGrid />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {departments?.map((dept) => {
          const accent = accentFor(dept.id);
          return (
            <Link
              key={dept.id}
              href={`/book/${dept.id}`}
              className={`card group flex flex-col gap-2 px-5 py-6 ring-1 ${accent.ring} transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div
                className={`mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent.gradient} text-lg text-white shadow`}
              >
                🩺
              </div>
              <p className="font-bold text-slate-900">{dept.deptName}</p>
              {dept.description && <p className="text-sm text-slate-500">{dept.description}</p>}
              <span className={`mt-2 text-sm font-semibold ${accent.text} group-hover:underline`}>
                View doctors →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-36 animate-pulse bg-violet-50/60" />
      ))}
    </div>
  );
}
