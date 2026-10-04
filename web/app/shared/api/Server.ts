type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class APIError extends Error {
  constructor(
    public readonly status: number,
    public readonly error?: string,
  ) {
    super(error ? String(error) : `Request failed (${status})`);
    this.name = 'APIError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`,
    { ...options, headers },
  );

  const data: unknown =
    response.status === 204 ? undefined : await response.json();

  if (!response.ok) throw new APIError(response.status);
  return data as T;
}

export const Server = {
  get<T>(endpoint: string, params?: QueryParams, options?: RequestInit) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null) query.set(key, String(value));
    }
    const suffix = query.size
      ? `${endpoint.includes('?') ? '&' : '?'}${query}`
      : '';
    return request<T>(`${endpoint}${suffix}`, { ...options, method: 'GET' });
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  delete<T = void>(endpoint: string, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
