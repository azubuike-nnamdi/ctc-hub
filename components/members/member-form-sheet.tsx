"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  emptyMemberValues,
  MemberFormFields,
  type MemberFormValues,
} from "@/components/members/member-form-fields"
import { memberSchema } from "@/lib/validation/schemas"

export function MemberFormSheet({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<MemberFormValues>
  onSubmit: (values: MemberFormValues) => Promise<void>
  title: string
}) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    values: {
      ...emptyMemberValues,
      ...defaultValues,
      dateJoined: defaultValues?.dateJoined ?? emptyMemberValues.dateJoined,
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {title.toLowerCase().includes("invite")
              ? "They will receive an email with a temporary password and must reset it on first sign-in."
              : "Member information for CTC Hub."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values)
            onOpenChange(false)
          })}
        >
          <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
            <MemberFormFields form={form} />
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={form.formState.isSubmitting}
              isLoadingText="Saving..."
            >
              {title.toLowerCase().includes("invite") ? "Send invite" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
