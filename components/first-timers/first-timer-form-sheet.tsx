"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  emptyFirstTimerValues,
  FirstTimerFormFields,
  type FirstTimerVisitorValues,
} from "@/components/first-timers/first-timer-form-fields"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { firstTimerVisitorSchema } from "@/lib/validation/schemas"

export function FirstTimerFormSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FirstTimerVisitorValues) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<FirstTimerVisitorValues>({
    resolver: zodResolver(firstTimerVisitorSchema),
    defaultValues: emptyFirstTimerValues,
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(emptyFirstTimerValues)
        onOpenChange(next)
      }}
    >
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle className="text-xl font-semibold">
            Register First Timer
          </SheetTitle>
          <SheetDescription>
            As an admin, you can onboard a first timer
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values)
            form.reset(emptyFirstTimerValues)
          })}
        >
          <div className="flex-1 overflow-y-auto px-4 py-2">
            <FirstTimerFormFields form={form} />
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
              isLoading={isSubmitting}
              isLoadingText="Submitting..."
            >
              Submit
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
