"use client"

import {
  CalendarDaysIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  WaypointsIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { can, isMemberRole, type Action, type Role } from "@/lib/auth/rbac"
import { APP_VERSION } from "@/lib/app-version"

const adminNavItems: {
  href: string
  label: string
  icon: typeof LayoutDashboardIcon
  action?: Action
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  {
    href: "/admin/members",
    label: "Members",
    icon: UsersIcon,
    action: "members:read",
  },
  {
    href: "/admin/first-timers",
    label: "First Timers",
    icon: UserRoundIcon,
    action: "first-timers:read",
  },
  {
    href: "/admin/soul-tracker",
    label: "Soul Tracker",
    icon: WaypointsIcon,
    action: "soul-tracker:read",
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: CalendarDaysIcon,
    action: "events:read",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: SettingsIcon,
    action: "settings:profile",
  },
]

const memberNavItems: {
  href: string
  label: string
  icon: typeof LayoutDashboardIcon
  action?: Action
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  {
    href: "/dashboard/log-soul",
    label: "Log Soul",
    icon: HeartHandshakeIcon,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
]

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const member = isMemberRole(role)
  const navItems = member ? memberNavItems : adminNavItems
  const homeHref = member ? "/dashboard" : "/admin"

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href={homeHref} className="flex items-center gap-2">
          <Image
            src="/img/ctc-logo.png"
            alt=""
            width={32}
            height={32}
            className="size-8"
            unoptimized
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold">CTC Hub</p>
            <p className="text-xs text-muted-foreground">Treasure City</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => !item.action || can(role, item.action))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={
                        item.href === homeHref
                          ? pathname === item.href
                          : pathname.startsWith(item.href)
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOutIcon />
          Logout
        </Button>
        <p className="px-2 pt-1 text-center text-xs text-muted-foreground">
          CTC Hub v{APP_VERSION}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
