import { apiFetch } from "./client";
import type { AppointmentSummary, BookRequest, BookResponse, PatientConsultationView } from "./types";

export function bookAppointment(token: string, request: BookRequest) {
  return apiFetch<BookResponse>("/appointments", { method: "POST", body: request, token });
}

export function listMyAppointments(token: string, upcoming: boolean) {
  return apiFetch<AppointmentSummary[]>("/appointments/my", { token, query: { upcoming } });
}

export function getAppointment(token: string, id: number) {
  return apiFetch<AppointmentSummary>(`/appointments/${id}`, { token });
}

export function getAppointmentConsultation(token: string, id: number) {
  return apiFetch<PatientConsultationView>(`/appointments/${id}/consultation`, { token });
}
