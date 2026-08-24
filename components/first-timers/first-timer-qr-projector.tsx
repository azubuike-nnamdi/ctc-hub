"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"

type QrResponse = {
  targetUrl: string
  branchName: string
  updatedAt: string | null
}

export function FirstTimerQrProjector() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["first-timers", "qr"],
    queryFn: () => api<QrResponse>("/api/first-timers/qr"),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      api<QrResponse>("/api/first-timers/qr", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(["first-timers", "qr"], data)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const imageSrc = query.data?.updatedAt
    ? `/api/first-timers/qr/image?t=${encodeURIComponent(query.data.updatedAt)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <p className="text-sm tracking-wide text-zinc-400 uppercase">
        Christ Treasure Centre
      </p>
      <h1 className="mt-2 text-center text-3xl font-semibold sm:text-4xl">
        Scan to register as a first timer
      </h1>
      {query.data?.branchName ? (
        <p className="mt-2 text-lg text-zinc-300">{query.data.branchName}</p>
      ) : null}
      <div className="mt-8">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="First timer registration QR code"
            className="size-[min(70vmin,36rem)] rounded-2xl bg-white p-4"
          />
        ) : (
          <div className="flex size-[min(70vmin,36rem)] items-center justify-center rounded-2xl border border-dashed border-zinc-700">
            <Button
              onClick={() => generateMutation.mutate()}
              isLoading={generateMutation.isPending}
              isLoadingText="Generating..."
            >
              Generate QR code
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        className="mt-8 border-zinc-700 bg-transparent text-white hover:bg-zinc-900 hover:text-white"
        render={<Link href="/admin/first-timers" />}
      >
        Close projector
      </Button>
    </div>
  )
}
