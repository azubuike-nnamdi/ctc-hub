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
  type ConsentChoice,
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
  const [justSaved, setJustSaved] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const saved = fromCookie || justSaved

  const openDetails = useCallback(() => {
    setDetailsOpen(true)
  }, [])

  async function saveChoice(choice: ConsentChoice) {
    setSubmitting(true)
    try {
      await api("/api/public/consent", {
        method: "POST",
        body: JSON.stringify({ version: CONSENT_VERSION, choice }),
      })
      setJustSaved(true)
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
  const showBanner = !saved

  return (
    <CookieConsentContext.Provider value={context}>
      {children}
      {showBanner ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4">
          <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border bg-background p-4 shadow-lg">
            <div className="grid gap-2">
              <p className="text-sm font-medium">Cookie Statement</p>
              <p className="text-sm text-muted-foreground">
                Please note that we take your privacy seriously and only process
                your personal information following the Nigeria Data Protection
                Act, 2023 and any applicable regulations. Your continued use of
                this platform indicates that you consent to the processing of
                your data by Christ Treasure Centre.
              </p>
              <p className="text-sm text-muted-foreground">
                Our site also uses cookies to enhance your experience on this
                platform. You can modify your preference using the options
                below. Please read our{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Cookie Policy
                </Link>{" "}
                for more information.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                variant="outline"
                onClick={openDetails}
                disabled={submitting}
              >
                Cookie Preference
              </Button>
              <Button
                variant="outline"
                onClick={() => void saveChoice("necessary")}
                isLoading={submitting}
              >
                Disable Cookies
              </Button>
              <Button
                onClick={() => void saveChoice("all")}
                isLoading={submitting}
              >
                Accept Cookies
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This website uses cookies to enhance your experience. Learn more
              here:{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              {" · "}
              <Link
                href="/cookies"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cookie Policy
              </Link>
            </p>
          </div>
        </div>
      ) : null}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie Preference</DialogTitle>
            <DialogDescription>
              Necessary cookies always stay on so you can sign in. Optional
              cookies remember staff layout choices. We do not use analytics or
              advertising cookies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {CONSENT_CATEGORIES.map((category) => (
              <div key={category.id} className="grid gap-1">
                <p className="font-medium">
                  {category.title}
                  {category.required ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Always on
                    </span>
                  ) : null}
                  {!category.inUse ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Not used
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">{category.body}</p>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Full write-up:{" "}
              <Link
                href="/cookies"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cookie Policy
              </Link>
              {" · "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {saved ? (
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => void saveChoice("necessary")}
                  isLoading={submitting}
                >
                  Disable Cookies
                </Button>
                <Button
                  onClick={() => void saveChoice("all")}
                  isLoading={submitting}
                >
                  Accept Cookies
                </Button>
              </>
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
      Cookie Preference
    </button>
  )
}
