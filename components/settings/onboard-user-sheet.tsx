"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { api } from "@/lib/api/client"
import { userCreateSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof userCreateSchema>

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "PASTOR", label: "Pastor" },
  { value: "USHER", label: "Usher" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
] as const

export function OnboardUserSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => api<{ items: { id: string; name: string }[] }>("/api/branch"),
    enabled: open,
  })

  const form = useForm<Values>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "USHER",
      branchId: "",
    },
  })

  const role = form.watch("role")

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      api("/api/users", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("Invitation email sent with a temporary password.")
      form.reset()
      queryClient.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Onboard staff</SheetTitle>
          <SheetDescription>
            Only a super admin can add people. They will receive an email with a
            temporary password and must reset it on first sign-in.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
            <div className="grid gap-1.5">
              <Label htmlFor="onboard-first-name">First name</Label>
              <Input
                id="onboard-first-name"
                aria-invalid={Boolean(form.formState.errors.firstName)}
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="onboard-last-name">Last name</Label>
              <Input
                id="onboard-last-name"
                aria-invalid={Boolean(form.formState.errors.lastName)}
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="onboard-email">Email</Label>
              <Input
                id="onboard-email"
                type="email"
                placeholder="name@church.org"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  value && form.setValue("role", value as Values["role"])
                }
                items={ROLE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={Boolean(form.formState.errors.role)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {role === "SUPER_ADMIN" ? null : (
              <div className="grid gap-1.5">
                <Label>Branch</Label>
                <Select
                  value={form.watch("branchId") ?? ""}
                  onValueChange={(value) =>
                    value && form.setValue("branchId", value)
                  }
                  items={branches.data?.items.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={Boolean(form.formState.errors.branchId)}
                  >
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.data?.items.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.branchId ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.branchId.message}
                  </p>
                ) : null}
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={mutation.isPending}
              isLoadingText="Sending..."
            >
              Send invite
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
