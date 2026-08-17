import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  action,
  extra,
}: {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  extra?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action || extra ? (
        <div className="flex flex-wrap gap-2">
          {extra}
          {action ? (
            <Button onClick={action.onClick}>{action.label}</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
