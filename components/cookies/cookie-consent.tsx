"use client"

import Link from "next/link"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api/client"
import {
  CONSENT_CATEGORIES,
  CONSENT_VERSION,
  isCurrentConsent,
  readBrowserConsentCookie,
} from "@/lib/cookies/consent"

type CookieConsentContextValue = {
  openDetails: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
)

export function useCookieConsent() {
  const value = useContext(CookieConsentContext)
  if (!value) {
    throw new Error("useCookieConsent must be used within CookieConsent")
  }
  return value
}

function subscribeConsent() {
  return () => {}
}

function getConsentSnapshot() {
  return isCurrentConsent(readBrowserConsentCookie())
}

function getServerConsentSnapshot() {
  return true
}

export function CookieConsent({ children }: { children: ReactNode }) {
  const fromCookie = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  )
  const [justAccepted, setJustAccepted] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const accepted = fromCookie || justAccepted

  const openDetails = useCallback(() => {
    setDetailsOpen(true)
  }, [])

  async function accept() {
    setSubmitting(true)
    try {
      await api("/api/public/consent", {
        method: "POST",
        body: JSON.stringify({ version: CONSENT_VERSION }),
      })
      setJustAccepted(true)
      setDetailsOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save your choice. Try again."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const context = useMemo(() => ({ openDetails }), [openDetails])
  const showBanner = !accepted

  return (
    <CookieConsentContext.Provider value={context}>
      {children}
      {showBanner ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center sm:gap-6">
            <p className="text-sm text-muted-foreground">
              CTC Hub uses cookies to keep you signed in and remember staff
              choices. Church records (members, first timers, and follow-up) are
              stored so we can serve Treasure City.{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy
              </Link>
            </p>
            <div className="flex shrink-0 gap-2 sm:justify-end">
              <Button variant="outline" onClick={openDetails}>
                View details
              </Button>
              <Button onClick={() => void accept()} isLoading={submitting}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How CTC Hub uses cookies and data</DialogTitle>
            <DialogDescription>
              You can read this anytime. Accepting records that you saw this
              notice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {CONSENT_CATEGORIES.map((category) => (
              <div key={category.id} className="grid gap-1">
                <p className="font-medium">{category.title}</p>
                <p className="text-sm text-muted-foreground">{category.body}</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Full write-up:{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy
              </Link>
            </p>
          </div>
          <DialogFooter>
            {accepted ? (
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            ) : (
              <Button onClick={() => void accept()} isLoading={submitting}>
                Accept
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CookieConsentContext.Provider>
  )
}

export function CookiePreferencesLink({ className }: { className?: string }) {
  const { openDetails } = useCookieConsent()

  return (
    <button
      type="button"
      className={
        className ??
        "font-medium text-primary underline-offset-4 hover:underline"
      }
      onClick={openDetails}
    >
      Cookie preferences
    </button>
  )
}
