"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listDoctors } from "@/lib/api/departments";
import { ApiClientError } from "@/lib/api/client";
import { accentFor } from "@/lib/accentColors";
import { useAuth } from "@/lib/auth/AuthContext";
import type { DoctorWithTimings } from "@/lib/api/types";

export default function DoctorListPage() {
  const { token } = useAuth();
  const params = useParams<{ departmentId: string }>();
  const departmentId = Number(params.departmentId);

  const [doctors, setDoctors] = useState<DoctorWithTimings[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listDoctors(token, departmentId)
      .then(setDoctors)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load doctors"));
  }, [token, departmentId]);

  return (
    <div>
      <Link href="/patient/book-appointment" className="mb-2 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← Departments
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Choose a doctor</h1>
      <p className="mb-6 text-slate-500">Step 2 of 3 — pick who you&apos;d like to see.</p>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
      {doctors?.length === 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No active doctors in this department right now.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {doctors?.map((doctor) => {
          const accent = accentFor(doctor.id + 2);
          return (
            <Link
              key={doctor.id}
              href={`/patient/book-appointment/${departmentId}/${doctor.id}`}
              className={`card flex flex-col gap-3 px-5 py-5 ring-1 ${accent.ring} transition hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent.gradient} text-xl text-white shadow`}
                >
                  👨‍⚕️
                </div>
                <div>
                  <p className="font-bold text-slate-900">{doctor.fullName}</p>
                  <p className="text-sm text-slate-500">{doctor.qualification}</p>
                  <p className={`text-xs font-semibold ${accent.text}`}>{doctor.specialization}</p>
                </div>
              </div>
              {doctor.about && <p className="text-sm text-slate-500">{doctor.about}</p>}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{doctor.experienceYears} yrs experience</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  ₹{doctor.consultationFee} consultation
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {doctor.timings.map((t) => (
                  <span
                    key={t.day}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {t.day.slice(0, 3)} {t.startTime.slice(0, 5)}–{t.endTime.slice(0, 5)}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
