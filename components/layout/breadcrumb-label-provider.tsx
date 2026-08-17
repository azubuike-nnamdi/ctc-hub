"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type BreadcrumbLabelContextValue = {
  labels: Record<string, string>
  setLabel: (segment: string, label: string | null) => void
}

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue>({
  labels: {},
  setLabel: () => {},
})

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({})

  const setLabel = useCallback((segment: string, label: string | null) => {
    setLabels((current) => {
      if (!label) {
        if (!(segment in current)) {
          return current
        }
        const next = { ...current }
        delete next[segment]
        return next
      }
      if (current[segment] === label) {
        return current
      }
      return { ...current, [segment]: label }
    })
  }, [])

  const value = useMemo(() => ({ labels, setLabel }), [labels, setLabel])

  return (
    <BreadcrumbLabelContext.Provider value={value}>
      {children}
    </BreadcrumbLabelContext.Provider>
  )
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbLabelContext)
}

export function useBreadcrumbLabel(
  segment: string | undefined,
  label?: string | null
) {
  const { setLabel } = useBreadcrumbLabels()

  useEffect(() => {
    if (!segment || !label) {
      return
    }
    setLabel(segment, label)
    return () => setLabel(segment, null)
  }, [segment, label, setLabel])
}
