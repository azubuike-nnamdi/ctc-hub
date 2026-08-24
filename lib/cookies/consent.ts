export const CONSENT_COOKIE = "ctc-consent"
export const CONSENT_VERSION = "2"
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365
export const COOKIE_POLICY_EFFECTIVE = "19 August 2026"

export type ConsentChoice = "all" | "necessary"

export type ConsentCookieValue = {
  version: string
  id: string
  at: string
  choice: ConsentChoice
}

export type ConsentCategory = {
  id: "necessary" | "functional" | "analytics" | "advertising"
  title: string
  body: string
  required: boolean
  inUse: boolean
}

export const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: "necessary",
    title: "Necessary cookies",
    body: "These are essential for CTC Hub to work and cannot be disabled. They keep you signed in, protect the login form, and record this cookie choice. They include the Auth.js session, refresh cookie, security cookies, and, for super admins, the selected campus.",
    required: true,
    inUse: true,
  },
  {
    id: "functional",
    title: "Functional cookies",
    body: "These remember staff choices such as whether the sidebar is open (sidebar_state). The site still works if you turn them off.",
    required: false,
    inUse: true,
  },
  {
    id: "analytics",
    title: "Performance and analytics cookies",
    body: "These would help us understand how people use CTC Hub. We do not currently set analytics cookies such as Google Analytics.",
    required: false,
    inUse: false,
  },
  {
    id: "advertising",
    title: "Advertising and targeting cookies",
    body: "These would be used to show adverts. CTC Hub does not use advertising or targeting cookies.",
    required: false,
    inUse: false,
  },
]

export function serializeConsentCookie(value: ConsentCookieValue) {
  return `${value.version}|${value.id}|${value.at}|${value.choice}`
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

  const [version, id, at, choice] = decoded.split("|")
  if (!version || !id || !at) {
    return null
  }

  return {
    version,
    id,
    at,
    choice: choice === "necessary" ? "necessary" : "all",
  }
}

export function isCurrentConsent(value: ConsentCookieValue | null) {
  return value?.version === CONSENT_VERSION
}

export function allowsFunctionalCookies(value?: ConsentCookieValue | null) {
  const consent = value === undefined ? readBrowserConsentCookie() : value
  return isCurrentConsent(consent) && consent?.choice === "all"
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
