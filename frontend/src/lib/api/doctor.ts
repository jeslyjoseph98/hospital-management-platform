import { apiFetch } from "./client";
import type {
  Consultation,
  DoctorAppointmentDetail,
  PatientDetail,
  SaveConsultationRequest,
  TodayAppointments,
} from "./types";

export function getTodayAppointments(token: string) {
  return apiFetch<TodayAppointments>("/doctor/appointments/today", { token });
}

export function getDoctorAppointment(token: string, id: number) {
  return apiFetch<DoctorAppointmentDetail>(`/doctor/appointments/${id}`, { token });
}

export function getDoctorPatient(token: string, patientId: number) {
  return apiFetch<PatientDetail>(`/doctor/patients/${patientId}`, { token });
}

export function saveConsultation(token: string, appointmentId: number, request: SaveConsultationRequest) {
  return apiFetch<Consultation>(`/doctor/appointments/${appointmentId}/consultation`, {
    method: "PUT",
    token,
    body: request,
  });
}

export function completeConsultation(token: string, appointmentId: number, request: SaveConsultationRequest) {
  return apiFetch<Consultation>(`/doctor/appointments/${appointmentId}/consultation/complete`, {
    method: "POST",
    token,
    body: request,
  });
}
