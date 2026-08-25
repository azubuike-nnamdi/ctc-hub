"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import type { SoulStage } from "@/lib/db/enums"

import { JourneyStepper } from "@/components/shared/journey-stepper"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api/client"
import {
  DEPARTMENT_SOD_MESSAGE,
  hasCompletedSod,
  SOUL_STAGE_LABELS,
  SOUL_STAGES,
  soulProgress,
} from "@/lib/utils/labels"

export function MemberJourneyCard({
  memberId,
  soulTracker,
  canEdit,
}: {
  memberId: string
  soulTracker: { id: string; currentStage: SoulStage } | null
  canEdit: boolean
}) {
  const queryClient = useQueryClient()
  const currentStage = soulTracker?.currentStage ?? "FOLLOW_UP"
  const [draftStage, setDraftStage] = useState<SoulStage | null>(null)
  const stage = draftStage ?? currentStage
  const progress = soulProgress(currentStage)

  const updateMutation = useMutation({
    mutationFn: (currentStage: SoulStage) =>
      api(`/api/members/${memberId}/journey`, {
        method: "PATCH",
        body: JSON.stringify({ currentStage }),
      }),
    onSuccess: () => {
      toast.success("Member journey updated.")
      setDraftStage(null)
      queryClient.invalidateQueries({ queryKey: ["member", memberId] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
      queryClient.invalidateQueries({ queryKey: ["soul-tracker"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Card className="my-5 ">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Discipleship journey</CardTitle>
          <CardDescription>
            First Timer, Follow Up, MIP, SOD, SOM, then SOL. Department serving
            opens after SOD is completed.
          </CardDescription>
        </div>
        {soulTracker ? (
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/admin/soul-tracker/${soulTracker.id}`} />
            }
          >
            Open tracker
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge value={currentStage} />
          <div className="flex min-w-40 flex-1 items-center gap-3 sm:max-w-xs">
            <Progress value={progress} className="w-full" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
        <JourneyStepper stage={currentStage} />
        {canEdit ? (
          <div className="grid gap-3 sm:max-w-sm">
            <Select
              value={stage}
              onValueChange={(value) => {
                if (value) setDraftStage(value as SoulStage)
              }}
              items={SOUL_STAGE_LABELS}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOUL_STAGES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {SOUL_STAGE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-fit"
              disabled={stage === currentStage}
              isLoading={updateMutation.isPending}
              isLoadingText="Updating..."
              onClick={() => updateMutation.mutate(stage)}
            >
              Update status
            </Button>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {hasCompletedSod(currentStage)
            ? "SOD is complete, so this member can be added to a department."
            : DEPARTMENT_SOD_MESSAGE}
        </p>
      </CardContent>
    </Card>
  )
}
