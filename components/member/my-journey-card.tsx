import Link from "next/link"
import type { SoulStage } from "@/lib/db/enums"

import { JourneyStepper } from "@/components/shared/journey-stepper"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SOUL_STAGE_LABELS, soulProgress } from "@/lib/utils/labels"

export function MyJourneyCard({
  currentStage,
}: {
  currentStage: SoulStage | null
}) {
  const stage = currentStage ?? "FOLLOW_UP"
  const progress = soulProgress(stage)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your discipleship journey</CardTitle>
        <CardDescription>
          Follow Up, MIP, SOD, SOM, then SOL. Department serving opens after SOD
          is completed.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge value={stage} />
          <div className="flex min-w-40 flex-1 items-center gap-3 sm:max-w-xs">
            <Progress value={progress} className="w-full" />
            <span className="text-sm text-muted-foreground tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
        <JourneyStepper stage={stage} />
        <p className="text-sm text-muted-foreground">
          You are currently on {SOUL_STAGE_LABELS[stage]}. MIP and SOD complete
          when the class is finished.{" "}
          <Link href="/dashboard/classes" className="font-medium text-primary hover:underline">
            Open classes
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}
