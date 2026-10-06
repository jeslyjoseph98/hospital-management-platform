"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAvailability } from "@/lib/api/departments";
import { bookAppointment } from "@/lib/api/appointments";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { BookResponse, DateAvailability, DoctorAvailability } from "@/lib/api/types";

export default function BookDoctorPage() {
  return <BookingFlow />;
}

const STATUS_BADGE: Record<DateAvailability["status"], string> = {
  AVAILABLE: "badge-available",
  FULLY_BOOKED: "badge-fully-booked",
  CLOSED: "badge-closed",
  NOT_AVAILABLE: "badge-not-available",
};

const STATUS_LABEL: Record<DateAvailability["status"], string> = {
  AVAILABLE: "Available",
  FULLY_BOOKED: "Fully booked",
  CLOSED: "Closed",
  NOT_AVAILABLE: "Not available",
};

function formatDateLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
}

function BookingFlow() {
  const { token } = useAuth();
  const params = useParams<{ departmentId: string; doctorId: string }>();
  const doctorId = Number(params.doctorId);
  const departmentId = params.departmentId;

  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [result, setResult] = useState<BookResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    getAvailability(token, doctorId)
      .then(setAvailability)
      .catch((err) => setError(err instanceof ApiClientError ? err.message : "Failed to load availability"));
  }, [token, doctorId]);

  async function confirmBooking() {
    if (!token || !selectedDate) return;
    setSubmitting(true);
    setBookError(null);
    try {
      const res = await bookAppointment(token, { doctorId, appointmentDate: selectedDate, reason: reason || undefined });
      setResult(res);
    } catch (err) {
      setBookError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <BookingSuccess result={result} />;

  return (
    <div>
      <Link
        href={`/patient/book-appointment/${departmentId}`}
        className="mb-2 inline-block text-sm font-semibold text-violet-600 hover:underline"
      >
        ← Doctors
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Choose a date</h1>
      <p className="mb-6 text-slate-500">Step 3 of 3 — pick an available date for {availability?.doctorName ?? "your visit"}.</p>

      {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}

      {!availability && !error && (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-violet-50/60" />
          ))}
        </div>
      )}

      {availability && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
            {availability.dates.map((d) => {
              const disabled = d.status !== "AVAILABLE";
              const selected = selectedDate === d.date;
              return (
                <button
                  key={d.date}
                  disabled={disabled}
                  onClick={() => setSelectedDate(d.date)}
                  className={`card flex flex-col items-center gap-1.5 px-2 py-4 text-center transition ${
                    disabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                  } ${selected ? "ring-2 ring-violet-500" : "ring-1 ring-transparent"}`}
                >
                  <span className="text-xs font-semibold text-slate-500">{formatDateLabel(d.date)}</span>
                  <span className={`badge ${STATUS_BADGE[d.status]}`}>{STATUS_LABEL[d.status]}</span>
                  {d.status === "AVAILABLE" && (
                    <span className="text-[11px] font-medium text-slate-500">{d.remaining} left</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="card px-5 py-5">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Reason for visit (optional)
                </span>
                <textarea
                  className="field-input w-full"
                  rows={3}
                  placeholder="e.g. Chest pain on exertion"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>

              {bookError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  ⚠️ {bookError}
                </p>
              )}

              <button
                onClick={confirmBooking}
                disabled={submitting}
                className="btn-primary mt-4 w-full py-3 text-base sm:w-auto sm:px-10"
              >
                {submitting ? "Booking…" : `Confirm booking for ${formatDateLabel(selectedDate)}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingSuccess({ result }: { result: BookResponse }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-6 py-8 text-center text-white">
          <p className="text-4xl">🎉</p>
          <p className="mt-2 text-lg font-bold">Booking successful</p>
          <p className="text-sm text-emerald-50">Appointment {result.appointmentCode}</p>
        </div>

        <div className="px-6 py-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Your token number</p>
          <p className="my-2 bg-gradient-to-br from-violet-600 to-fuchsia-500 bg-clip-text text-6xl font-black text-transparent">
            {result.tokenNumber}
          </p>
          <p className="text-sm text-slate-500">
            Please report by <span className="font-bold text-slate-800">{result.reportingTime.slice(0, 5)}</span>
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
            <InfoRow label="Doctor" value={result.doctorName} />
            <InfoRow label="Department" value={result.departmentName} />
            <InfoRow label="Date" value={result.appointmentDate} />
            <InfoRow label="Timings" value={result.consultationTimings} />
            <InfoRow label="Patient" value={result.patientName} />
            <InfoRow label="Patient code" value={result.patientCode} />
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Link href="/patient/appointments" className="btn-primary flex-1 py-2.5 text-center">
              View my appointments
            </Link>
            <Link href="/patient/book-appointment" className="btn-secondary flex-1 py-2.5 text-center">
              Book another
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
