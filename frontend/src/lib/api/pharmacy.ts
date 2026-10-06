import { apiFetch } from "./client";
import type { PrescriptionDetail, PrescriptionListItem } from "./types";

export function getPendingPrescriptions(token: string, date?: string) {
  return apiFetch<PrescriptionListItem[]>("/pharmacy/prescriptions/pending", { token, query: { date } });
}

export function searchPrescriptions(token: string, q: string) {
  return apiFetch<PrescriptionListItem[]>("/pharmacy/prescriptions/search", { token, query: { q } });
}

export function getPrescriptionDetail(token: string, consultationId: number) {
  return apiFetch<PrescriptionDetail>(`/pharmacy/prescriptions/${consultationId}`, { token });
}

export function dispensePrescription(token: string, consultationId: number, remarks?: string) {
  return apiFetch<PrescriptionDetail>(`/pharmacy/prescriptions/${consultationId}/dispense`, {
    method: "POST",
    token,
    body: { remarks },
  });
}
