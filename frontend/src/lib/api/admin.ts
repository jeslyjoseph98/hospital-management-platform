import { apiFetch } from "./client";
import type {
  AdminDepartment,
  AdminDoctor,
  AdminDoctorSummary,
  CreateDoctorRequest,
  DoctorBookings,
  PagedResponse,
  TimingInput,
  UpdateDoctorRequest,
} from "./types";

export function listAdminDepartments(token: string) {
  return apiFetch<AdminDepartment[]>("/admin/departments", { token });
}

export function createAdminDepartment(token: string, deptName: string, description?: string) {
  return apiFetch<AdminDepartment>("/admin/departments", { method: "POST", token, body: { deptName, description } });
}

export function updateAdminDepartment(token: string, id: number, deptName: string, description?: string) {
  return apiFetch<AdminDepartment>(`/admin/departments/${id}`, { method: "PUT", token, body: { deptName, description } });
}

export function updateAdminDepartmentStatus(token: string, id: number, active: boolean) {
  return apiFetch<AdminDepartment>(`/admin/departments/${id}/status`, { method: "PATCH", token, body: { active } });
}

export function listAdminDoctors(
  token: string,
  filters: { departmentId?: number; name?: string; active?: boolean; page?: number; size?: number } = {},
) {
  return apiFetch<PagedResponse<AdminDoctorSummary>>("/admin/doctors", { token, query: filters });
}

export function getAdminDoctor(token: string, id: number) {
  return apiFetch<AdminDoctor>(`/admin/doctors/${id}`, { token });
}

export function createAdminDoctor(token: string, request: CreateDoctorRequest) {
  return apiFetch<AdminDoctor>("/admin/doctors", { method: "POST", token, body: request });
}

export function updateAdminDoctor(token: string, id: number, request: UpdateDoctorRequest) {
  return apiFetch<AdminDoctor>(`/admin/doctors/${id}`, { method: "PUT", token, body: request });
}

export function replaceAdminDoctorTimings(token: string, id: number, timings: TimingInput[]) {
  return apiFetch<AdminDoctor>(`/admin/doctors/${id}/timings`, { method: "PUT", token, body: { timings } });
}

export function updateAdminDoctorStatus(token: string, id: number, active: boolean) {
  return apiFetch<AdminDoctor>(`/admin/doctors/${id}/status`, { method: "PATCH", token, body: { active } });
}

export function getAdminDoctorBookings(token: string, id: number, date: string) {
  return apiFetch<DoctorBookings>(`/admin/doctors/${id}/bookings`, { token, query: { date } });
}
