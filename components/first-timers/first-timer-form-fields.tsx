"use client"

import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { HearAboutSource } from "@/lib/db/enums"
import {
  AGE_RANGE_LABELS,
  AGE_RANGES,
  GENDER_LABELS,
  GENDERS,
  HEAR_ABOUT_LABELS,
  HEAR_ABOUT_SOURCES,
  MEMBERSHIP_INTEREST_LABELS,
  MEMBERSHIP_INTERESTS,
} from "@/lib/utils/labels"
import { firstTimerVisitorSchema } from "@/lib/validation/schemas"

export type FirstTimerVisitorValues = z.infer<typeof firstTimerVisitorSchema>

export const emptyFirstTimerValues: FirstTimerVisitorValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  occupation: "",
  birthday: "",
  gender: undefined as unknown as FirstTimerVisitorValues["gender"],
  ageRange: undefined as unknown as FirstTimerVisitorValues["ageRange"],
  membershipInterest:
    undefined as unknown as FirstTimerVisitorValues["membershipInterest"],
  hearAboutUs: [],
  hearAboutOther: "",
  prayerRequest: "",
}

export function FirstTimerFormFields({
  form,
}: {
  form: UseFormReturn<FirstTimerVisitorValues>
}) {
  const hearAboutUs = form.watch("hearAboutUs") ?? []

  function toggleSource(source: HearAboutSource, checked: boolean) {
    const next = checked
      ? [...hearAboutUs, source]
      : hearAboutUs.filter((item) => item !== source)
    form.setValue("hearAboutUs", next, { shouldValidate: true })
    if (source === "OTHER" && !checked) {
      form.setValue("hearAboutOther", "")
    }
  }

  return (
    <div className="grid content-start gap-6">
      <section className="grid gap-4">
        <h3 className="font-heading text-base font-semibold">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="First Name"
            error={form.formState.errors.firstName?.message}
          >
            <Input
              placeholder="First Name"
              aria-invalid={Boolean(form.formState.errors.firstName)}
              {...form.register("firstName")}
            />
          </Field>
          <Field
            label="Last Name"
            error={form.formState.errors.lastName?.message}
          >
            <Input
              placeholder="Last Name"
              aria-invalid={Boolean(form.formState.errors.lastName)}
              {...form.register("lastName")}
            />
          </Field>
          <Field
            label="Phone Number"
            error={form.formState.errors.phone?.message}
          >
            <Input
              placeholder="Phone Number"
              aria-invalid={Boolean(form.formState.errors.phone)}
              {...form.register("phone")}
            />
          </Field>
          <Field
            label="Email Address"
            error={form.formState.errors.email?.message}
          >
            <Input
              type="email"
              placeholder="Email Address"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
          </Field>
          <Field label="Occupation">
            <Input placeholder="Occupation" {...form.register("occupation")} />
          </Field>
          <Field
            label="Birthday"
            error={form.formState.errors.birthday?.message}
          >
            <Input
              placeholder="dd/mm"
              inputMode="numeric"
              aria-invalid={Boolean(form.formState.errors.birthday)}
              {...form.register("birthday")}
            />
          </Field>
        </div>
        <ChoiceRow
          label="Gender"
          error={form.formState.errors.gender?.message}
          options={GENDERS.map((value) => ({
            value,
            label: GENDER_LABELS[value],
          }))}
          value={form.watch("gender")}
          onChange={(value) =>
            form.setValue(
              "gender",
              value as FirstTimerVisitorValues["gender"],
              { shouldValidate: true }
            )
          }
        />
        <ChoiceRow
          label="Age Range"
          error={form.formState.errors.ageRange?.message}
          options={AGE_RANGES.map((value) => ({
            value,
            label: AGE_RANGE_LABELS[value],
          }))}
          value={form.watch("ageRange")}
          onChange={(value) =>
            form.setValue(
              "ageRange",
              value as FirstTimerVisitorValues["ageRange"],
              { shouldValidate: true }
            )
          }
        />
      </section>

      <section className="grid gap-4">
        <h3 className="font-heading text-base font-semibold">
          Membership Information
        </h3>
        <ChoiceRow
          label="Will you like to become a member of CTC?"
          error={form.formState.errors.membershipInterest?.message}
          options={MEMBERSHIP_INTERESTS.map((value) => ({
            value,
            label: MEMBERSHIP_INTEREST_LABELS[value],
          }))}
          value={form.watch("membershipInterest")}
          onChange={(value) =>
            form.setValue(
              "membershipInterest",
              value as FirstTimerVisitorValues["membershipInterest"],
              { shouldValidate: true }
            )
          }
        />
        <div className="grid gap-2">
          <Label>How did you hear about us?</Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {HEAR_ABOUT_SOURCES.filter((source) => source !== "OTHER").map(
              (source) => (
                <Choice
                  key={source}
                  label={HEAR_ABOUT_LABELS[source]}
                  checked={hearAboutUs.includes(source)}
                  onCheckedChange={(checked) => toggleSource(source, checked)}
                />
              )
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Choice
              label={HEAR_ABOUT_LABELS.OTHER}
              checked={hearAboutUs.includes("OTHER")}
              onCheckedChange={(checked) => toggleSource("OTHER", checked)}
            />
            {hearAboutUs.includes("OTHER") ? (
              <Input
                className="max-w-xs"
                placeholder="Please specify"
                aria-invalid={Boolean(form.formState.errors.hearAboutOther)}
                {...form.register("hearAboutOther")}
              />
            ) : null}
          </div>
          {form.formState.errors.hearAboutUs ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.hearAboutUs.message}
            </p>
          ) : null}
          {form.formState.errors.hearAboutOther ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.hearAboutOther.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="font-heading text-base font-semibold">Prayer Request</h3>
        <Textarea
          rows={5}
          placeholder="Prayer request"
          {...form.register("prayerRequest")}
        />
      </section>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function ChoiceRow({
  label,
  error,
  options,
  value,
  onChange,
}: {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <Choice
            key={option.value}
            label={option.label}
            checked={value === option.value}
            onCheckedChange={(checked) => {
              if (checked) onChange(option.value)
            }}
          />
        ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function Choice({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
      />
      {label}
    </label>
  )
}
