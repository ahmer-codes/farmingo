import type { ApiErrorBody, ApiResponse } from "~/types";
import { resolveAuthToken } from "./authToken";
import { getFirebaseIdToken } from "~/lib/firebase";

export class ApiClientError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** When true, body is sent as FormData and Content-Type is omitted (browser sets boundary). */
  formData?: boolean;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
  onUploadProgress?: (percent: number) => void;
  _retried?: boolean;
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function parseJsonPayload<T>(
  raw: string,
): ApiResponse<T> | ApiErrorBody | null {
  try {
    return JSON.parse(raw) as ApiResponse<T> | ApiErrorBody;
  } catch {
    return null;
  }
}

function unwrapData<T>(payload: ApiResponse<T> | ApiErrorBody | null): T {
  if (payload && "data" in payload) {
    return payload.data;
  }
  return payload as T;
}

async function xhrRequest<T>(
  url: string,
  options: RequestOptions,
  token?: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "POST", url);
    xhr.responseType = "text";
    xhr.setRequestHeader("Accept", "application/json");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      options.onUploadProgress?.(percent);
    };
    xhr.onload = async () => {
      const payload = parseJsonPayload<T>(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(unwrapData(payload));
        return;
      }

      if (xhr.status === 401 && !options._retried && import.meta.client) {
        const freshToken = await getFirebaseIdToken(true);
        if (freshToken) {
          try {
            resolve(
              await xhrRequest<T>(
                url,
                { ...options, token: freshToken, _retried: true },
                freshToken,
              ),
            );
            return;
          } catch (retryErr) {
            reject(retryErr);
            return;
          }
        }
      }

      const message =
        (payload && "message" in payload && payload.message) ||
        `Request failed with status ${xhr.status}`;
      reject(
        new ApiClientError(
          message,
          xhr.status,
          payload as ApiErrorBody | undefined,
        ),
      );
    };
    xhr.onerror = () => reject(new ApiClientError("Failed to fetch", 0));
    xhr.send(options.body as FormData);
  });
}

/**
 * Thin HTTP client. Domain services call this, components never call fetch directly.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const config = useRuntimeConfig();
  const baseUrl = String(config.public.apiBaseUrl).replace(/\/$/, "");
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}${buildQuery(options.query)}`;

  const isForm = Boolean(options.formData && options.body instanceof FormData);

  // XHR path supports upload progress for multipart.
  if (isForm && options.onUploadProgress && import.meta.client) {
    const token = await resolveAuthToken(options.token);
    return xhrRequest<T>(url, options, token);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  const token = await resolveAuthToken(options.token);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body:
      options.body === undefined
        ? undefined
        : isForm
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  let payload: ApiResponse<T> | ApiErrorBody | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && "message" in payload && payload.message) ||
      `Request failed with status ${response.status}`;

    if (response.status === 401 && !options._retried && import.meta.client) {
      const freshToken = await getFirebaseIdToken(true);
      if (freshToken) {
        return apiRequest<T>(path, {
          ...options,
          token: freshToken,
          _retried: true,
        });
      }
    }

    throw new ApiClientError(
      message,
      response.status,
      payload as ApiErrorBody | undefined,
    );
  }

  return unwrapData(payload);
}
