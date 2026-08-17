function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function withHttps(host: string | undefined) {
  if (!host) {
    return undefined
  }

  const value =
    host.startsWith("http://") || host.startsWith("https://")
      ? host
      : `https://${host}`

  return isHttpUrl(value) ? value.replace(/\/$/, "") : undefined
}

export function getAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv && isHttpUrl(fromEnv)) {
    return fromEnv.replace(/\/$/, "")
  }

  return (
    withHttps(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    withHttps(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  )
}

export function getAppOrigin() {
  return new URL(getAppUrl())
}
