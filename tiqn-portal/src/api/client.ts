import type { ApiResponse, ApiError, ErrorCode } from "./types";
import { getMockResponse } from "./mock";

const BASE_URL =
  import.meta.env.VITE_API_BASE ||
  "https://erp.tiqn.com.vn:8888/api/method/customize_erpnext.api.employee_portal";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

let sessionToken: string | null = null;

export function setToken(token: string | null) {
  console.log("[Auth] setToken:", token ? `${token.substring(0, 8)}...` : "null");
  sessionToken = token;
}

export function getToken() {
  return sessionToken;
}

export class ApiException extends Error {
  constructor(
    public readonly apiError: ApiError,
    public readonly serverTime: string,
  ) {
    super(apiError.message);
    this.name = "ApiException";
  }

  get code(): ErrorCode {
    return this.apiError.code;
  }

  get field(): string | null {
    return this.apiError.field;
  }

  get details(): Record<string, any> {
    return this.apiError.details;
  }
}

export class NetworkError extends Error {
  constructor(
    message = "Có lỗi, vui lòng thử lại",
    public readonly retryable = true,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

type HttpMethod = "GET" | "POST";

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

function isRetryable(err: unknown): boolean {
  return err instanceof NetworkError && err.retryable;
}

function retryDelay(attempt: number): number {
  // 1s → 2s → 4s + random 0-1s jitter
  const base = RETRY_BASE_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface RequestOptions {
  method: HttpMethod;
  endpoint: string;
  params?: Record<string, any>;
  noToken?: boolean;
  isUpload?: boolean;
  body?: FormData;
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const { method, endpoint, params, noToken, isUpload, body } = options;

  // Check mock layer first
  const mockResult = await getMockResponse(endpoint, params);
  if (mockResult !== null) {
    console.log(`[API] ${method} ${endpoint} → MOCK`, mockResult);
    return mockResult as T;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await _doRequest<T>(options);
    } catch (err) {
      lastError = err;

      // RATE_LIMITED: wait retry_after, then allow one retry
      if (err instanceof ApiException && err.code === "RATE_LIMITED") {
        const retryAfter = err.details?.retry_after;
        if (retryAfter && attempt === 0) {
          console.log(`[API] ${endpoint} RATE_LIMITED, waiting ${retryAfter}s`);
          await sleep(retryAfter * 1000);
          continue;
        }
        throw err;
      }

      // Only retry on network/5xx errors
      if (!isRetryable(err) || attempt >= MAX_RETRIES) {
        throw err;
      }

      const delayMs = retryDelay(attempt);
      console.log(`[API] ${endpoint} retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delayMs)}ms`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function _doRequest<T>(options: RequestOptions): Promise<T> {
  const { method, endpoint, params, noToken, isUpload, body } = options;

  const headers: Record<string, string> = {
    "X-Portal-Client-Version": APP_VERSION,
  };

  if (!noToken && sessionToken) {
    headers["X-Portal-Token"] = sessionToken;
  }

  let url = `${BASE_URL}.${endpoint}`;
  let fetchBody: BodyInit | undefined;

  if (method === "GET" && params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        qs.append(k, String(v));
      }
    }
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  } else if (method === "POST") {
    if (isUpload && body) {
      fetchBody = body;
    } else if (params) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      const form = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        }
      }
      fetchBody = form;
    }
  }

  console.log(`[API] ${method} ${endpoint}`, { params: params || {}, hasToken: !!headers["X-Portal-Token"] });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "omit",
      headers,
      body: fetchBody,
    });
  } catch (fetchErr) {
    console.error(`[API] ${endpoint} NETWORK ERROR:`, fetchErr);
    throw new NetworkError();
  }

  if (res.status === 403) {
    console.error(`[API] ${endpoint} HTTP 403`);
    throw new NetworkError("Lỗi cấu hình ứng dụng (HTTP 403)", false);
  }

  if (res.status >= 500) {
    console.error(`[API] ${endpoint} HTTP ${res.status}`);
    throw new NetworkError();
  }

  let json: any;
  try {
    json = await res.json();
  } catch (parseErr) {
    console.error(`[API] ${endpoint} JSON parse error:`, parseErr);
    throw new NetworkError();
  }

  const envelope = json.message as ApiResponse<T>;
  if (!envelope || typeof envelope.ok === "undefined") {
    // Frappe raw error format (ValidationError, PermissionError, etc.)
    const excType = json.exc_type || json.exception;
    const serverMsgs = json._server_messages;
    let frappeMsg = "";
    if (serverMsgs) {
      try {
        const parsed = JSON.parse(serverMsgs);
        const msgs = Array.isArray(parsed) ? parsed : [parsed];
        frappeMsg = msgs.map((m: any) => {
          try { return JSON.parse(m).message; } catch { return String(m); }
        }).join("; ");
      } catch { frappeMsg = String(serverMsgs); }
    }
    console.error(`[API] ${endpoint} FRAPPE ERROR:`, { exc_type: excType, message: frappeMsg, raw: json });
    throw new NetworkError(frappeMsg || `Lỗi server: ${excType || "unknown"}`);
  }

  if (!envelope.ok) {
    console.error(`[API] ${endpoint} ERROR:`, envelope.error);
    throw new ApiException(envelope.error, envelope.server_time);
  }

  console.log(`[API] ${endpoint} OK:`, envelope.data);
  return envelope.data;
}
