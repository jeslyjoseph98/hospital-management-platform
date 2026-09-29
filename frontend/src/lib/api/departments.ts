import { apiFetch } from "./client";
import type { Department, DoctorAvailability, DoctorWithTimings } from "./types";

export function listDepartments(token: string) {
  return apiFetch<Department[]>("/departments", { token });
}

export function listDoctors(token: string, departmentId: number) {
  return apiFetch<DoctorWithTimings[]>(`/departments/${departmentId}/doctors`, { token });
}

export function getAvailability(token: string, doctorId: number) {
  return apiFetch<DoctorAvailability>(`/doctors/${doctorId}/availability`, { token });
}
