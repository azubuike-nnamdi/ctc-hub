class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApiError"
  }
}

type Envelope<T> = {
  success?: boolean
  message?: string
  error?: string
  data?: T
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  const payload = (await response.json().catch(() => ({}))) as Envelope<T>

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message ?? payload.error ?? "Request failed")
  }

  return (payload.data ?? payload) as T
}
