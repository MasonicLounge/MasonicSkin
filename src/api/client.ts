import { getAccessToken } from '../auth/token.js';

export const API_BASE = '/api/v1';

/** Structured error transported by API responses when the server returns a known error code. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = false } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && getAccessToken()) {
    headers['Authorization'] = `Bearer ${getAccessToken()}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Network request failed');
  }

  if (!response.ok) {
    let code = 'unknown_error';
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { code?: string; message?: string };
      code = payload.code ?? code;
      message = payload.message ?? message;
    } catch {
      // non-JSON error body, keep defaults
    }
    throw new ApiError(response.status, code, message);
  }

  const text = await response.text();
  if (text === '') {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, token = false) => request<T>(path, { token }),
  post: <T>(path: string, body: unknown, token = false) => request<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body: unknown, token = false) => request<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token = false) => request<T>(path, { method: 'DELETE', token }),
};

export interface HealthResponse {
  status: string;
}

export interface VersionResponse {
  backend: string;
  db: number;
}

export function fetchHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>('/health');
}

export function fetchVersion(): Promise<VersionResponse> {
  return api.get<VersionResponse>('/version');
}