"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DownloadIcon, Maximize2Icon, QrCodeIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api/client"

type QrResponse = {
  targetUrl: string
  branchName: string
  branchSlug: string
  updatedAt: string | null
}

export function FirstTimerQrDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["first-timers", "qr"],
    queryFn: () => api<QrResponse>("/api/first-timers/qr"),
    enabled: open,
    refetchOnMount: false,
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      api<QrResponse>("/api/first-timers/qr", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(["first-timers", "qr"], data)
      toast.success("QR code saved for this campus.")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const updatedAt = query.data?.updatedAt
  const imageSrc = updatedAt
    ? `/api/first-timers/qr/image?t=${encodeURIComponent(updatedAt)}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>First timer QR code</DialogTitle>
          <DialogDescription>
            Display this on a projector or print it. Visitors scan it to open
            the {query.data?.branchName ?? "campus"} first timer form. The CTC
            logo in the centre is stored with the code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid justify-items-center gap-3">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="First timer registration QR code"
              className="size-64 rounded-lg border bg-white p-2 sm:size-80"
            />
          ) : (
            <div className="flex size-64 items-center justify-center rounded-lg border border-dashed bg-muted/40 sm:size-80">
              <QrCodeIcon className="size-12 text-muted-foreground" />
            </div>
          )}
          {query.data?.targetUrl ? (
            <p className="max-w-full text-center text-xs break-all text-muted-foreground">
              {query.data.targetUrl}
            </p>
          ) : null}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {imageSrc ? (
            <>
              <Button
                variant="outline"
                render={
                  <Link href={imageSrc} download="ctc-first-timer-qr.png" />
                }
              >
                <DownloadIcon />
                Download
              </Button>
              <Button
                variant="outline"
                render={<Link href="/admin/first-timers/qr" target="_blank" />}
              >
                <Maximize2Icon />
                Projector
              </Button>
            </>
          ) : null}
          <Button
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            isLoadingText="Generating..."
          >
            {imageSrc ? "Regenerate" : "Generate QR code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
