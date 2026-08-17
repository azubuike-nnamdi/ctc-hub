"use client"

import Link from "next/link"
import { Fragment } from "react"
import { usePathname } from "next/navigation"

import { useBreadcrumbLabels } from "@/components/layout/breadcrumb-label-provider"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  members: "Members",
  "first-timers": "First Timers",
  "soul-tracker": "Soul Tracker",
  events: "Events",
  settings: "Settings",
  "log-soul": "Log Soul",
  register: "Register",
  signup: "Sign up",
  support: "Support",
}

function looksLikeId(segment: string) {
  return /^c[a-z0-9]{8,}$/i.test(segment) || /^[0-9a-f-]{8,}$/i.test(segment)
}

function labelForSegment(
  segment: string,
  dynamicLabels: Record<string, string>
) {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment]
  }
  if (dynamicLabels[segment]) {
    return dynamicLabels[segment]
  }
  if (looksLikeId(segment)) {
    return "Details"
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const { labels } = useBreadcrumbLabels()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: labelForSegment(segment, labels),
      isLast: index === segments.length - 1,
    }
  })

  if (crumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem className="min-w-0">
              {crumb.isLast ? (
                <BreadcrumbPage className="truncate font-medium">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
