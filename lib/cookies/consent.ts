export const CONSENT_COOKIE = "ctc-consent"
export const CONSENT_VERSION = "1"
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365

export type ConsentCookieValue = {
  version: string
  id: string
  at: string
}

export type ConsentCategory = {
  id: "necessary" | "functional" | "application"
  title: string
  body: string
}

export const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: "necessary",
    title: "Necessary cookies",
    body: "These keep you signed in and protect the login form. They include the Auth.js session and security cookies. The site cannot work without them.",
  },
  {
    id: "functional",
    title: "Functional cookies",
    body: "These remember staff choices such as the open sidebar and, for super admins, the selected campus (ctc-branch-id and sidebar_state).",
  },
  {
    id: "application",
    title: "Church records and email",
    body: "CTC Hub stores member, first-timer, soul-win, and support details in our database so the church can follow up and run campus life. Invite and password emails are sent through Mailtrap. This is not stored in cookies.",
  },
]

export function serializeConsentCookie(value: ConsentCookieValue) {
  return `${value.version}|${value.id}|${value.at}`
}

export function parseConsentCookie(
  raw: string | undefined | null
): ConsentCookieValue | null {
  if (!raw) {
    return null
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  })()

  const [version, id, at] = decoded.split("|")
  if (!version || !id || !at) {
    return null
  }

  return { version, id, at }
}

export function isCurrentConsent(value: ConsentCookieValue | null) {
  return value?.version === CONSENT_VERSION
}

export function readBrowserConsentCookie() {
  if (typeof document === "undefined") {
    return null
  }

  const prefix = `${CONSENT_COOKIE}=`
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix))
  if (!row) {
    return null
  }

  return parseConsentCookie(row.slice(prefix.length))
}
