"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { DISCIPLESHIP_PROGRAM_LABELS, DISCIPLESHIP_PROGRAMS } from "@/lib/utils/labels"
import { discipleshipClassCreateSchema } from "@/lib/validation/schemas"

type Values = z.infer<typeof discipleshipClassCreateSchema>

const emptyValues: Values = {
  program: "MIP",
  title: "",
  firstSunday: "",
  facilitatorName: "",
}

export function ClassFormSheet({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Values) => Promise<void>
  isSubmitting: boolean
}) {
  const [program, setProgram] = useState<Values["program"]>("MIP")
  const form = useForm<Values>({
    resolver: zodResolver(discipleshipClassCreateSchema),
    defaultValues: emptyValues,
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setProgram("MIP")
          form.reset(emptyValues)
        }
        onOpenChange(next)
      }}
    >
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create class</SheetTitle>
          <SheetDescription>
            MIP is a one-off Sunday. Create a class for that set of first
            timers. SOD is eight consecutive Sundays once it is announced.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4">
            <div className="grid gap-1.5">
              <Label htmlFor="class-program">Program</Label>
              <Select
                value={program}
                onValueChange={(value) => {
                  if (value === "MIP" || value === "SOD") {
                    setProgram(value)
                    form.setValue("program", value)
                  }
                }}
                items={DISCIPLESHIP_PROGRAM_LABELS}
              >
                <SelectTrigger id="class-program" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLESHIP_PROGRAMS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {DISCIPLESHIP_PROGRAM_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {program === "MIP"
                  ? "This Sunday is one MIP set. The next MIP Sunday is a new class for a different set. Marking them present makes them members."
                  : "Eight consecutive Sundays. Members who have completed MIP register from their dashboard."}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="class-first-sunday">
                {program === "MIP" ? "Sunday" : "First Sunday"}
              </Label>
              <Input
                id="class-first-sunday"
                type="date"
                aria-invalid={Boolean(form.formState.errors.firstSunday)}
                {...form.register("firstSunday")}
              />
              {form.formState.errors.firstSunday ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstSunday.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  If this is not a Sunday, the class starts the following
                  Sunday.
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="class-title">Title (optional)</Label>
              <Input
                id="class-title"
                placeholder={
                  program === "MIP" ? "MIP · 30 Aug 2026" : "SOD · 6 Sep 2026"
                }
                {...form.register("title")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="class-facilitator">Facilitator (optional)</Label>
              <Input
                id="class-facilitator"
                placeholder="Who is taking this class?"
                {...form.register("facilitatorName")}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="brand"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={isSubmitting}
              isLoadingText="Creating..."
              onClick={() => void form.handleSubmit(onSubmit)()}
            >
              Create class
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
