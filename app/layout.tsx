import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getAppOrigin } from "@/lib/utils/app-url"

export const metadata: Metadata = {
  metadataBase: getAppOrigin(),
  title: {
    default: "CTC Hub",
    template: "%s | CTC Hub",
  },
  icons: {
    icon: "/img/ctc-logo.png",
  },
  description:
    "Church management for Christ Treasure Centre (Treasure City). Track members, first timers, discipleship, and events from one place.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "CTC Hub",
    title: "CTC Hub | Christ Treasure Centre",
    description:
      "Manage members, first timers, Soul Tracker, and events for Christ Treasure Centre.",
    images: [
      {
        url: "/img/ctc-logo.png",
        width: 1200,
        height: 630,
        alt: "CTC Hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CTC Hub",
    description:
      "Church management for Christ Treasure Centre. Members, first timers, discipleship, and events.",
    images: ["/img/ctc-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        GeistSans.variable,
        GeistMono.variable,
        "font-sans"
      )}
    >
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors />
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
