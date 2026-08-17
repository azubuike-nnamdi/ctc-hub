"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import {
  MemberFormFields,
  type MemberFormValues,
} from "@/components/members/member-form-fields"
import { PageHeader } from "@/components/shared/page-header"
import { QuerySection } from "@/components/shared/query-section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/api/client"
import type { Member } from "@/lib/db/types"
import { memberSchema } from "@/lib/validation/schemas"

type MeResponse = {
  member: Member
}

function toFormValues(member: Member): MemberFormValues {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    phone: member.phone,
    email: member.email ?? "",
    gender: member.gender,
    dateOfBirth: member.dateOfBirth ? member.dateOfBirth.slice(0, 10) : "",
    address: member.address ?? "",
    chapel: member.chapel,
    dateJoined: member.dateJoined.slice(0, 10),
    photoUrl: member.photoUrl ?? "",
  }
}

export function MemberSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api<MeResponse>("/api/me"),
  })

  const member = query.data?.member
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    values: member ? toFormValues(member) : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: MemberFormValues) =>
      api("/api/me", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Profile updated.")
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Update your member information."
      />
      <QuerySection
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        hasData={Boolean(member)}
      >
        {member ? (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Member ID {member.memberCode}. Changes apply to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3"
                onSubmit={form.handleSubmit((values) =>
                  mutation.mutate(values)
                )}
              >
                <MemberFormFields form={form} showDateJoined={false} />
                <Button
                  type="submit"
                  className="mt-2"
                  isLoading={mutation.isPending}
                  isLoadingText="Saving..."
                >
                  Save changes
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </QuerySection>
    </div>
  )
}
