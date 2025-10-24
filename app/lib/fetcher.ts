/**
 * Simple fetcher wrapper for handling API requests
 */

interface FetcherOptions extends RequestInit {
  params?: Record<string, string>;
}

export class FetcherError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = "FetcherError";
  }
}

async function fetcher<T = unknown>(
  url: string,
  options?: FetcherOptions,
): Promise<T> {
  const { params, ...fetchOptions } = options || {};

  // Build URL with query parameters if provided
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams(params);
    finalUrl = `${url}?${searchParams.toString()}`;
  }

  const response = await fetch(finalUrl, fetchOptions);

  if (!response.ok) {
    throw new FetcherError(
      `Request failed: ${response.statusText}`,
      response.status,
      response.statusText,
    );
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || response.status === 204) {
    return undefined as T;
  }

  // Parse JSON response
  if (contentType.includes("application/json")) {
    return response.json();
  }

  // Return text for other content types
  return response.text() as T;
}

// Convenience methods
export const get = <T = unknown>(url: string, options?: FetcherOptions) =>
  fetcher<T>(url, { ...options, method: "GET" });

export const post = <T = unknown>(
  url: string,
  body?: unknown,
  options?: FetcherOptions,
) =>
  fetcher<T>(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

export const put = <T = unknown>(
  url: string,
  body?: unknown,
  options?: FetcherOptions,
) =>
  fetcher<T>(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

export const del = <T = unknown>(url: string, options?: FetcherOptions) =>
  fetcher<T>(url, { ...options, method: "DELETE" });

export default fetcher;
