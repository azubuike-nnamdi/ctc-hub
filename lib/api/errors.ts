import { NextResponse } from "next/server"
import { ZodError } from "zod"

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export class MemberInviteError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "MemberInviteError"
    this.status = status
  }
}

export class HttpError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "HttpError"
    this.status = status
  }
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message ?? "Invalid input", 400)
  }

  if (error instanceof MemberInviteError || error instanceof HttpError) {
    return jsonError(error.message, error.status)
  }

  if (error instanceof Error && error.name === "RateLimitError") {
    return jsonError("Too many attempts. Try again later.", 429)
  }

  if (error instanceof Error && error.name === "ForbiddenError") {
    return jsonError("You do not have permission to do that.", 403)
  }

  if (error instanceof Error && error.name === "UnauthorizedError") {
    return jsonError("Authentication required", 401)
  }

  if (error instanceof Error && error.name === "PasswordResetRequiredError") {
    return jsonError("Password reset required", 401)
  }

  console.error(error)
  return jsonError("Something went wrong.", 500)
}

export function emptyToNull(value?: string | null) {
  if (!value || value.trim() === "") {
    return null
  }
  return value
}
