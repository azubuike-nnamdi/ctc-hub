"use client"

import { useMemo, useState } from "react"
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { UsersIcon } from "lucide-react"

import { OnboardUserSheet } from "@/components/settings/onboard-user-sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection, TableSkeleton } from "@/components/shared/query-section"
import { StatusBadge } from "@/components/shared/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api/client"
import { can, type Role } from "@/lib/auth/rbac"
import { fullName, initials } from "@/lib/utils/labels"
import { profileUpdateSchema } from "@/lib/validation/schemas"

const PAGE_SIZE = 10

type UserRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  passwordResetAt: string | null
  passwordChangedAt: string | null
  createdAt: string
  branch: { name: string } | null
}

type ListResponse = {
  items: UserRow[]
  total: number
  page: number
  pageSize: number
}

type AccountActivity = {
  lastLoginAt: string | null
  passwordResetAt: string | null
  passwordChangedAt: string | null
  createdAt: string
}

function formatStamp(value: string | null) {
  if (!value) return null
  return format(new Date(value), "MMM d, yyyy, HH:mm")
}

function DateCell({ value }: { value: string | null }) {
  const label = formatStamp(value)
  if (!label) {
    return <span className="text-muted-foreground">Never</span>
  }
  return <span className="whitespace-nowrap">{label}</span>
}

function ActivityTile({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">
        {formatStamp(value) ?? "Never"}
      </p>
    </div>
  )
}

export function SettingsView({
  role,
  firstName,
  lastName,
  email,
  activity,
}: {
  role: Role
  firstName: string
  lastName: string
  email: string
  activity: AccountActivity
}) {
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)

  const params = useMemo(() => {
    const search = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    })
    if (q) search.set("q", q)
    return search.toString()
  }, [q, page])

  const users = useQuery({
    queryKey: ["users", params],
    queryFn: () => api<ListResponse>(`/api/users?${params}`),
    enabled: can(role, "users:read"),
    placeholderData: keepPreviousData,
  })

  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { firstName, lastName },
  })

  const profileMutation = useMutation({
    mutationFn: (values: { firstName: string; lastName: string }) =>
      api("/api/users", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => toast.success("Profile updated."),
    onError: (error: Error) => toast.error(error.message),
  })

  const total = users.data?.total ?? 0
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Update your profile and manage staff accounts."
        action={
          can(role, "users:write")
            ? { label: "Onboard staff", onClick: () => setOnboardOpen(true) }
            : undefined
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{fullName(firstName, lastName)}</CardTitle>
                <CardDescription>{email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3"
              onSubmit={profileForm.handleSubmit((values) =>
                profileMutation.mutateAsync(values)
              )}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>First name</Label>
                  <Input
                    aria-invalid={Boolean(
                      profileForm.formState.errors.firstName
                    )}
                    {...profileForm.register("firstName")}
                  />
                  {profileForm.formState.errors.firstName ? (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-1.5">
                  <Label>Last name</Label>
                  <Input
                    aria-invalid={Boolean(
                      profileForm.formState.errors.lastName
                    )}
                    {...profileForm.register("lastName")}
                  />
                  {profileForm.formState.errors.lastName ? (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="submit"
                className="w-fit"
                isLoading={profileMutation.isPending}
                isLoadingText="Saving..."
              >
                Save profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account activity</CardTitle>
            <CardDescription>
              Sign-in and password history for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActivityTile label="Last login" value={activity.lastLoginAt} />
              <ActivityTile
                label="Password updated"
                value={activity.passwordChangedAt}
              />
              <ActivityTile
                label="Password reset"
                value={activity.passwordResetAt}
              />
              <ActivityTile label="Created" value={activity.createdAt} />
            </div>
          </CardContent>
        </Card>
      </div>

      {can(role, "users:read") ? (
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Staff accounts
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                People who can sign in to CTC Hub.
              </p>
            </div>
            <Input
              placeholder="Search name or email"
              className="max-w-xs"
              value={q}
              onChange={(event) => {
                setPage(1)
                setQ(event.target.value)
              }}
            />
          </div>

          <QuerySection
            isPending={users.isPending}
            isError={users.isError}
            isFetching={users.isFetching}
            error={users.error}
            onRetry={() => users.refetch()}
            hasData={Boolean(users.data)}
            skeleton={<TableSkeleton columns={9} />}
          >
            {users.data?.items.length ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead>Password reset</TableHead>
                      <TableHead>Password updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar size="sm">
                              <AvatarFallback>
                                {initials(item.firstName, item.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {fullName(item.firstName, item.lastName)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.email}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={item.role} />
                        </TableCell>
                        <TableCell>
                          {item.branch?.name ?? "All branches"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            value={
                              item.mustChangePassword
                                ? "PENDING_RESET"
                                : item.isActive
                                  ? "ACTIVE"
                                  : "INACTIVE"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <DateCell value={item.createdAt} />
                        </TableCell>
                        <TableCell>
                          <DateCell value={item.lastLoginAt} />
                        </TableCell>
                        <TableCell>
                          <DateCell value={item.passwordResetAt} />
                        </TableCell>
                        <TableCell>
                          <DateCell value={item.passwordChangedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                  <span>
                    {from}-{to} of {total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * PAGE_SIZE >= total}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No staff accounts"
                description={
                  q
                    ? "No staff match that search."
                    : "Onboard staff to give them access to CTC Hub."
                }
                icon={UsersIcon}
              />
            )}
          </QuerySection>
        </div>
      ) : null}

      <OnboardUserSheet open={onboardOpen} onOpenChange={setOnboardOpen} />
    </div>
  )
}
