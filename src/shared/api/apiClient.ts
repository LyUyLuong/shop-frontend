import { ApiError } from "./apiError";
import type { ApiResponse } from "./apiTypes";
import { createRequestId, readResponseRequestId } from "./requestId";
import { env } from "../config/env";

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

export type ApiMethodOptions = Omit<ApiRequestOptions, "method">;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { accessToken, query, body, headers, ...requestInit } = options;

  const requestId = createRequestId();
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("X-Request-Id", requestId);

  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...requestInit,
    headers: requestHeaders,
    body: prepareBody(body, requestHeaders),
  });

  const responseRequestId = readResponseRequestId(response) ?? requestId;
  const apiResponse = await readJson<ApiResponse<T>>(response);

  if (!response.ok) {
    throw toApiError(response, apiResponse, responseRequestId);
  }

  if (!apiResponse) {
    return undefined as T;
  }

  if (!apiResponse.success) {
    throw toApiError(response, apiResponse, responseRequestId);
  }

  return apiResponse.data as T;
}

export const apiClient = {
  get<T>(path: string, options?: ApiMethodOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options?: ApiMethodOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options?: ApiMethodOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options?: ApiMethodOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options?: ApiMethodOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${env.apiBaseUrl}${normalizedPath}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function prepareBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof FormData) {
    return body;
  }

  if (typeof body === "string") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "text/plain");
    }

    return body;
  }

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

async function readJson<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

function toApiError<T>(
  response: Response,
  apiResponse: ApiResponse<T> | undefined,
  requestId: string,
): ApiError {
  return new ApiError({
    status: response.status,
    code: apiResponse?.error?.code,
    backendMessage: apiResponse?.error?.message ?? response.statusText,
    requestId,
    details: apiResponse?.error?.details,
  });
}