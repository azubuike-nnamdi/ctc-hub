import type { SoulStage } from "@/lib/db/enums"
import { cn } from "@/lib/utils"
import {
  JOURNEY_STEPS,
  journeyStepIndex,
  journeyStepState,
} from "@/lib/utils/labels"

export function JourneyStepper({ stage }: { stage: SoulStage }) {
  const currentIndex = journeyStepIndex(stage)
  const lastIndex = JOURNEY_STEPS.length - 1

  return (
    <ol className="flex w-full min-w-0 items-start overflow-x-auto">
      {JOURNEY_STEPS.map((step, index) => {
        const state = journeyStepState(stage, index)
        const inboundComplete = currentIndex > index - 1 && index > 0
        const outboundComplete = currentIndex > index
        return (
          <li
            key={step.id}
            className="flex min-w-20 flex-1 flex-col items-center"
          >
            <div className="flex w-full items-center">
              <div
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1",
                  index === 0
                    ? "bg-transparent"
                    : inboundComplete
                      ? "bg-primary"
                      : "bg-border"
                )}
              />
              <div
                className={cn(
                  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  state === "complete" && "bg-primary text-primary-foreground",
                  state === "current" &&
                    "border-2 border-primary bg-background text-primary",
                  state === "upcoming" &&
                    "border border-border bg-background text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <div
                aria-hidden="true"
                className={cn(
                  "h-0.5 flex-1",
                  index === lastIndex
                    ? "bg-transparent"
                    : outboundComplete
                      ? "bg-primary"
                      : "bg-border"
                )}
              />
            </div>
            <p
              className={cn(
                "mt-2 px-1 text-center text-sm font-medium",
                state === "upcoming" ? "text-muted-foreground" : "text-primary"
              )}
            >
              {step.label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
