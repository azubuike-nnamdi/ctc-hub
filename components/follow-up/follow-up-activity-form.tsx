"use client"

import { addDays, format } from "date-fns"
import { useState } from "react"
import type { FirstTimerStatus, FollowUpType } from "@/lib/db/enums"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  FIRST_TIMER_STATUS_LABELS,
  OPEN_FIRST_TIMER_STATUSES,
  FOLLOW_UP_TYPE_LABELS,
  FOLLOW_UP_TYPES,
} from "@/lib/utils/labels"

export type FollowUpActivityValues = {
  type: FollowUpType
  contactedAt: string
  nextContactAt: string
  closeFollowUp: boolean
  wouldWorshipAgain: boolean | null
  status?: FirstTimerStatus
  note: string
}

function nowLocalValue() {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm")
}

function defaultNextLocalValue() {
  return format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
}

export function FollowUpActivityForm({
  onSubmit,
  isSubmitting,
  showWorshipQuestion,
  showStatus,
  currentStatus,
  submitLabel = "Save activity",
}: {
  onSubmit: (values: FollowUpActivityValues) => Promise<void> | void
  isSubmitting: boolean
  showWorshipQuestion?: boolean
  showStatus?: boolean
  currentStatus?: FirstTimerStatus
  submitLabel?: string
}) {
  const [type, setType] = useState<FollowUpType>("CALL")
  const [contactedAt, setContactedAt] = useState(nowLocalValue)
  const [nextContactAt, setNextContactAt] = useState(defaultNextLocalValue)
  const [closeFollowUp, setCloseFollowUp] = useState(false)
  const [worship, setWorship] = useState("UNASKED")
  const [status, setStatus] = useState<FirstTimerStatus | undefined>(
    currentStatus
  )
  const [note, setNote] = useState("")

  async function saveActivity() {
    try {
      await onSubmit({
        type,
        contactedAt,
        nextContactAt,
        closeFollowUp,
        wouldWorshipAgain:
          worship === "YES" ? true : worship === "NO" ? false : null,
        status: showStatus ? status : undefined,
        note,
      })
      setNote("")
      setContactedAt(nowLocalValue())
      setNextContactAt(defaultNextLocalValue())
      setCloseFollowUp(false)
      setWorship("UNASKED")
      setType("CALL")
    } catch {
      // Parent mutations already toast the error.
    }
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-1.5">
        <Label htmlFor="follow-up-type">Activity</Label>
        <Select
          value={type}
          onValueChange={(value) => {
            if (value) setType(value as FollowUpType)
          }}
          items={FOLLOW_UP_TYPE_LABELS}
        >
          <SelectTrigger id="follow-up-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOLLOW_UP_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {FOLLOW_UP_TYPE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="follow-up-contacted-at">When you reached them</Label>
        <Input
          id="follow-up-contacted-at"
          type="datetime-local"
          value={contactedAt}
          onChange={(event) => setContactedAt(event.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={closeFollowUp}
          onCheckedChange={(next) => setCloseFollowUp(next === true)}
        />
        No further follow-up
      </label>
      {closeFollowUp ? null : (
        <div className="grid gap-1.5">
          <Label htmlFor="follow-up-next-contact">Next contact</Label>
          <Input
            id="follow-up-next-contact"
            type="datetime-local"
            value={nextContactAt}
            onChange={(event) => setNextContactAt(event.target.value)}
          />
        </div>
      )}
      {showWorshipQuestion ? (
        <div className="grid gap-1.5">
          <Label htmlFor="follow-up-worship">
            Would they love to worship with us again?
          </Label>
          <Select
            value={worship}
            onValueChange={(value) => value && setWorship(value)}
            items={{
              UNASKED: "Not asked",
              YES: "Yes",
              NO: "No",
            }}
          >
            <SelectTrigger id="follow-up-worship" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNASKED">Not asked</SelectItem>
              <SelectItem value="YES">Yes</SelectItem>
              <SelectItem value="NO">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {showStatus && currentStatus && currentStatus !== "MEMBER" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="follow-up-status">First-timer status</Label>
          <Select
            value={status ?? currentStatus}
            onValueChange={(value) => {
              if (value) setStatus(value as FirstTimerStatus)
            }}
            items={FIRST_TIMER_STATUS_LABELS}
          >
            <SelectTrigger id="follow-up-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPEN_FIRST_TIMER_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {FIRST_TIMER_STATUS_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="follow-up-note">Note</Label>
        <Textarea
          id="follow-up-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What you discussed, next steps, or prayer needs."
        />
      </div>
      <Button
        type="button"
        disabled={!note.trim()}
        isLoading={isSubmitting}
        isLoadingText="Saving..."
        onClick={() => void saveActivity()}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
