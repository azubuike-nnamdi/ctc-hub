"use client"

import type { UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { memberSchema } from "@/lib/validation/schemas"

export type MemberFormValues = z.infer<typeof memberSchema>

export const emptyMemberValues: MemberFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  gender: "MALE",
  dateOfBirth: "",
  address: "",
  chapel: "ADULT",
  dateJoined: new Date().toISOString().slice(0, 10),
  photoUrl: "",
}

export function MemberFormFields({
  form,
  showDateJoined = true,
}: {
  form: UseFormReturn<MemberFormValues>
  showDateJoined?: boolean
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>First Name</Label>
          <Input
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
          <Label>Last Name</Label>
          <Input
            aria-invalid={Boolean(form.formState.errors.lastName)}
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.lastName.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Phone</Label>
          <Input
            aria-invalid={Boolean(form.formState.errors.phone)}
            {...form.register("phone")}
          />
          {form.formState.errors.phone ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Gender</Label>
          <Select
            value={form.watch("gender")}
            onValueChange={(value) => {
              if (value)
                form.setValue("gender", value as MemberFormValues["gender"])
            }}
            items={{ MALE: "Male", FEMALE: "Female" }}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(form.formState.errors.gender)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Chapel</Label>
          <Select
            value={form.watch("chapel")}
            onValueChange={(value) => {
              if (value)
                form.setValue("chapel", value as MemberFormValues["chapel"])
            }}
            items={{ ADULT: "Adult", YOUTH: "Youth", JUNIOR: "Junior" }}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(form.formState.errors.chapel)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADULT">Adult</SelectItem>
              <SelectItem value="YOUTH">Youth</SelectItem>
              <SelectItem value="JUNIOR">Junior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Date of Birth</Label>
          <Input type="date" {...form.register("dateOfBirth")} />
        </div>
        {showDateJoined ? (
          <div className="grid gap-1.5">
            <Label>Date Joined</Label>
            <Input
              type="date"
              aria-invalid={Boolean(form.formState.errors.dateJoined)}
              {...form.register("dateJoined")}
            />
            {form.formState.errors.dateJoined ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.dateJoined.message}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label>Address</Label>
        <Input {...form.register("address")} />
      </div>
      <div className="grid gap-1.5">
        <Label>Photo URL</Label>
        <Input
          placeholder="https://"
          aria-invalid={Boolean(form.formState.errors.photoUrl)}
          {...form.register("photoUrl")}
        />
        {form.formState.errors.photoUrl ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.photoUrl.message}
          </p>
        ) : null}
      </div>
    </>
  )
}
