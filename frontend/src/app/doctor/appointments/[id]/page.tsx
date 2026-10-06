"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  completeConsultation,
  getDoctorAppointment,
  getDoctorPatient,
  saveConsultation,
} from "@/lib/api/doctor";
import { ApiClientError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import type { DoctorAppointmentDetail, PastVisit, PrescriptionItem } from "@/lib/api/types";

const TIMING_OPTIONS = ["BEFORE_FOOD", "AFTER_FOOD", "BEDTIME", "AS_NEEDED"] as const;

const emptyForm = {
  chiefComplaint: "",
  symptoms: "",
  temperatureC: "",
  pulseBpm: "",
  bpSystolic: "",
  bpDiastolic: "",
  weightKg: "",
  diagnosis: "",
  doctorNotes: "",
  advice: "",
  followUpDate: "",
};

export default function DoctorAppointmentPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const appointmentId = Number(params.id);

  const [detail, setDetail] = useState<DoctorAppointmentDetail | null>(null);
  const [pastVisits, setPastVisits] = useState<PastVisit[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getDoctorAppointment(token, appointmentId).then((d) => {
      setDetail(d);
      if (d.consultation) {
        const c = d.consultation;
        setForm({
          chiefComplaint: c.chiefComplaint ?? "",
          symptoms: c.symptoms ?? "",
          temperatureC: c.temperatureC?.toString() ?? "",
          pulseBpm: c.pulseBpm?.toString() ?? "",
          bpSystolic: c.bpSystolic?.toString() ?? "",
          bpDiastolic: c.bpDiastolic?.toString() ?? "",
          weightKg: c.weightKg?.toString() ?? "",
          diagnosis: c.diagnosis ?? "",
          doctorNotes: c.doctorNotes ?? "",
          advice: c.advice ?? "",
          followUpDate: c.followUpDate ?? "",
        });
        setPrescription(c.prescription);
      }
      getDoctorPatient(token, d.patient.patientId)
        .then((p) => setPastVisits(p.pastVisits))
        .catch(() => {});
    });
  }, [token, appointmentId]);

  const readOnly = detail?.status === "COMPLETED";

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addRow() {
    setPrescription((p) => [
      ...p,
      { medicineName: "", strength: "", dosagePattern: "1-0-1", timing: "AFTER_FOOD", durationDays: 5, instructions: "" },
    ]);
  }

  function updateRow(index: number, patch: Partial<PrescriptionItem>) {
    setPrescription((p) => p.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setPrescription((p) => p.filter((_, i) => i !== index));
  }

  function buildRequest() {
    return {
      chiefComplaint: form.chiefComplaint || undefined,
      symptoms: form.symptoms || undefined,
      temperatureC: form.temperatureC ? Number(form.temperatureC) : undefined,
      pulseBpm: form.pulseBpm ? Number(form.pulseBpm) : undefined,
      bpSystolic: form.bpSystolic ? Number(form.bpSystolic) : undefined,
      bpDiastolic: form.bpDiastolic ? Number(form.bpDiastolic) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      diagnosis: form.diagnosis || undefined,
      doctorNotes: form.doctorNotes || undefined,
      advice: form.advice || undefined,
      followUpDate: form.followUpDate || undefined,
      prescription,
    };
  }

  async function onSave() {
    if (!token) return;
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const consultation = await saveConsultation(token, appointmentId, buildRequest());
      setDetail((d) => (d ? { ...d, consultation } : d));
      setSavedMessage("Saved.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save consultation");
    } finally {
      setSaving(false);
    }
  }

  async function onComplete() {
    if (!token) return;
    setError(null);
    setSavedMessage(null);
    setCompleting(true);
    try {
      const consultation = await completeConsultation(token, appointmentId, buildRequest());
      setDetail((d) => (d ? { ...d, status: "COMPLETED", consultation } : d));
      setSavedMessage("Consultation completed.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to complete consultation");
    } finally {
      setCompleting(false);
    }
  }

  if (!detail) {
    return <p className="text-slate-500">Loading…</p>;
  }

  return (
    <div>
      <Link href="/doctor/today" className="mb-4 inline-block text-sm font-semibold text-violet-600 hover:underline">
        ← Today
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="card px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Patient</h2>
              <span className={`badge ${detail.status === "COMPLETED" ? "badge-available" : "badge-not-available"}`}>
                {detail.status}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900">{detail.patient.fullName}</p>
            <p className="text-sm text-slate-500">{detail.patient.patientCode}</p>
            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between"><dt>Age / Gender</dt><dd>{detail.patient.age} / {detail.patient.gender}</dd></div>
              {detail.patient.phone && <div className="flex justify-between"><dt>Phone</dt><dd>{detail.patient.phone}</dd></div>}
              {detail.patient.address && <div className="flex justify-between gap-4"><dt>Address</dt><dd className="text-right">{detail.patient.address}</dd></div>}
              <div className="flex justify-between"><dt>Token</dt><dd>{detail.tokenNumber}</dd></div>
              <div className="flex justify-between"><dt>Reporting</dt><dd>{detail.reportingTime.slice(0, 5)}</dd></div>
            </dl>
            <Link
              href={`/doctor/patients/${detail.patient.patientId}`}
              className="mt-3 inline-block text-sm font-semibold text-violet-600 hover:underline"
            >
              View full history →
            </Link>
          </div>

          <div className="card px-5 py-5">
            <h2 className="mb-3 font-bold text-slate-800">Past visits</h2>
            {!pastVisits && <p className="text-sm text-slate-500">Loading…</p>}
            {pastVisits?.length === 0 && <p className="text-sm text-slate-500">No past visits.</p>}
            <div className="space-y-3">
              {pastVisits?.slice(0, 5).map((v, i) => (
                <div key={i} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{v.date}</p>
                  <p className="text-slate-500">{v.doctorName} · {v.departmentName}</p>
                  {v.diagnosis && <p className="mt-1 text-slate-700">{v.diagnosis}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠️ {error}</p>}
          {savedMessage && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✅ {savedMessage}</p>}

          <div className="card px-5 py-5">
            <h2 className="mb-3 font-bold text-slate-800">Consultation</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Chief complaint</span>
                <input disabled={readOnly} className="field-input w-full" value={form.chiefComplaint} onChange={(e) => update("chiefComplaint", e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Symptoms</span>
                <textarea disabled={readOnly} rows={2} className="field-input w-full" value={form.symptoms} onChange={(e) => update("symptoms", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Temperature (°C)</span>
                <input disabled={readOnly} type="number" step="0.1" className="field-input w-full" value={form.temperatureC} onChange={(e) => update("temperatureC", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Pulse (bpm)</span>
                <input disabled={readOnly} type="number" className="field-input w-full" value={form.pulseBpm} onChange={(e) => update("pulseBpm", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">BP systolic</span>
                <input disabled={readOnly} type="number" className="field-input w-full" value={form.bpSystolic} onChange={(e) => update("bpSystolic", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">BP diastolic</span>
                <input disabled={readOnly} type="number" className="field-input w-full" value={form.bpDiastolic} onChange={(e) => update("bpDiastolic", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Weight (kg)</span>
                <input disabled={readOnly} type="number" step="0.1" className="field-input w-full" value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Follow-up date</span>
                <input disabled={readOnly} type="date" className="field-input w-full" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Diagnosis</span>
                <input disabled={readOnly} className="field-input w-full" value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Advice (shown to patient)</span>
                <textarea disabled={readOnly} rows={2} className="field-input w-full" value={form.advice} onChange={(e) => update("advice", e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Doctor notes (internal)</span>
                <textarea disabled={readOnly} rows={2} className="field-input w-full" value={form.doctorNotes} onChange={(e) => update("doctorNotes", e.target.value)} />
              </label>
            </div>
          </div>

          <div className="card px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Prescription</h2>
              {!readOnly && (
                <button onClick={addRow} className="btn-secondary px-3 py-1.5 text-sm">
                  + Add medicine
                </button>
              )}
            </div>
            {prescription.length === 0 && <p className="text-sm text-slate-500">No medicines added.</p>}
            <div className="space-y-2">
              {prescription.map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-6">
                  <input
                    disabled={readOnly}
                    placeholder="Medicine"
                    className="field-input sm:col-span-2"
                    value={row.medicineName}
                    onChange={(e) => updateRow(i, { medicineName: e.target.value })}
                  />
                  <input
                    disabled={readOnly}
                    placeholder="Strength"
                    className="field-input"
                    value={row.strength ?? ""}
                    onChange={(e) => updateRow(i, { strength: e.target.value })}
                  />
                  <input
                    disabled={readOnly}
                    placeholder="1-0-1"
                    className="field-input"
                    value={row.dosagePattern}
                    onChange={(e) => updateRow(i, { dosagePattern: e.target.value })}
                  />
                  <select
                    disabled={readOnly}
                    className="field-input"
                    value={row.timing}
                    onChange={(e) => updateRow(i, { timing: e.target.value as PrescriptionItem["timing"] })}
                  >
                    {TIMING_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      disabled={readOnly}
                      type="number"
                      min={1}
                      placeholder="Days"
                      className="field-input w-full"
                      value={row.durationDays}
                      onChange={(e) => updateRow(i, { durationDays: Number(e.target.value) })}
                    />
                    {!readOnly && (
                      <button onClick={() => removeRow(i)} className="text-rose-500 hover:text-rose-700">
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    disabled={readOnly}
                    placeholder="Instructions (optional)"
                    className="field-input sm:col-span-6"
                    value={row.instructions ?? ""}
                    onChange={(e) => updateRow(i, { instructions: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          {!readOnly && (
            <div className="flex gap-3">
              <button onClick={onSave} disabled={saving || completing} className="btn-secondary px-5 py-2 text-sm">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={onComplete} disabled={saving || completing} className="btn-primary px-5 py-2 text-sm">
                {completing ? "Completing…" : "Complete Consultation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
