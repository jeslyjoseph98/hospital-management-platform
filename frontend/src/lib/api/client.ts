import { TOKEN_STORAGE_KEY } from "@/lib/auth/storage";
import type { ApiError, ApiResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export class ApiClientError extends Error {
  errorCode: string;
  fieldErrors: ApiError["fieldErrors"];
  data: unknown;
  status: number;

  constructor(body: ApiError, status: number) {
    super(body.message);
    this.errorCode = body.errorCode;
    this.fieldErrors = body.fieldErrors;
    this.data = body.data;
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, query } = options;

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || !json || json.success === false) {
    const errorBody: ApiError = json && json.success === false
      ? json
      : { success: false, errorCode: "UNKNOWN_ERROR", message: "Something went wrong" };

    // UI-R5: any API call returning 401 means the token is gone/expired — drop it and bounce to /login.
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new ApiClientError(errorBody, response.status);
  }

  return json.data;
}
