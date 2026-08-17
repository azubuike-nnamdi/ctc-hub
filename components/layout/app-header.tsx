"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { initials } from "@/lib/utils/labels"

type BranchOption = { id: string; name: string }

export function AppHeader({
  user,
  branches,
  currentBranchId,
}: {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
  branches: BranchOption[]
  currentBranchId?: string | null
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/members": "Members",
    "/first-timers": "First Timers",
    "/soul-tracker": "Soul Tracker",
    "/events": "Events",
    "/settings": "Settings",
  }
  const title =
    Object.entries(titles).find(([href]) =>
      href === "/dashboard" ? pathname === href : pathname.startsWith(href)
    )?.[1] ?? "CTC Hub"

  function onBranchChange(branchId: string | null) {
    if (!branchId) {
      return
    }
    startTransition(async () => {
      await fetch("/api/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId }),
      })
      router.refresh()
    })
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <div className="h-4 w-px bg-border" />
      <h1 className="text-sm font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {user.role === "SUPER_ADMIN" && branches.length > 0 ? (
          <Select
            value={currentBranchId ?? undefined}
            onValueChange={onBranchChange}
            disabled={pending}
            items={branches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
          >
            <SelectTrigger className="min-w-40 max-w-56">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
        >
          <SunIcon className="dark:hidden" />
          <MoonIcon className="hidden dark:block" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full" />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback>
                {initials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>
              {user.firstName} {user.lastName}
              <p className="font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                window.location.href = "/settings"
              }}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
