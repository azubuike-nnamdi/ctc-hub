export function authCookieOptions(maxAge: number, secure?: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: secure ?? process.env.NODE_ENV === "production",
  }
}

export function sessionCookieName(request: Request) {
  const secure = new URL(request.url).protocol === "https:"
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token"
}

export function safeNextPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("://")
  ) {
    return "/"
  }

  return value
}
