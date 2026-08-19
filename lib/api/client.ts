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

async function parseEnvelope<T>(response: Response) {
  return (await response.json().catch(() => ({}))) as Envelope<T>
}

async function tryRefreshSession() {
  const response = await fetch("/api/auth/refresh", { method: "POST" })
  return response.ok
}

export async function api<T>(
  path: string,
  init?: RequestInit,
  retried = false
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })

  const payload = await parseEnvelope<T>(response)

  if (
    !retried &&
    response.status === 401 &&
    payload.message !== "Password reset required" &&
    !path.startsWith("/api/auth/")
  ) {
    const refreshed = await tryRefreshSession()
    if (refreshed) {
      return api<T>(path, init, true)
    }
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message ?? payload.error ?? "Request failed")
  }

  return (payload.data ?? payload) as T
}
