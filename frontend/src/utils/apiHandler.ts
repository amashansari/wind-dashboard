const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export function getQuery(
  payload: Record<string, string | number | boolean | null | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function apiHandler<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  query: string = "",
  body?: unknown
): Promise<T> {
  const fullUrl = `${BASE_URL}${endpoint}${query}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT")) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse failure for error
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}
