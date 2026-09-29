import { apiFetch } from "./client";
import type { LoginResponse, PatientProfile, RegisterRequest, RegisterResponse } from "./types";

export function register(request: RegisterRequest) {
  return apiFetch<RegisterResponse>("/auth/register", { method: "POST", body: request });
}

export function login(phone: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { phone, password } });
}

export function getMyProfile(token: string) {
  return apiFetch<PatientProfile>("/patients/me", { token });
}
