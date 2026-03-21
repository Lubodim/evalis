export type ApiRequestOptions = RequestInit & {
  studentId?: string;
};

const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { studentId, headers, ...init } = options;

  const response = await fetch(`${DEFAULT_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(studentId ? { "x-student-id": studentId } : {}),
      ...(headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
