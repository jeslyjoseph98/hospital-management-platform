import { apiFetch } from "./client";
import type { LoginResponse, PatientProfile, RegisterRequest, RegisterResponse, Role, UserSummary } from "./types";

export function register(request: RegisterRequest) {
  return apiFetch<RegisterResponse>("/auth/register", { method: "POST", body: request });
}

export function login(role: Role, phone: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { role, phone, password } });
}

export function me(token: string) {
  return apiFetch<UserSummary>("/auth/me", { token });
}

export function getMyProfile(token: string) {
  return apiFetch<PatientProfile>("/patients/me", { token });
}
