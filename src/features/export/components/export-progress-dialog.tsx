"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useOverlay } from "@/features/trip-detail/lib/overlay-context"
import type { ExportProgress } from "../lib/export-trip"

interface ExportProgressDialogProps {
  open: boolean
  progress: ExportProgress | null
  onClose: () => void
  onCancel: () => void
  onRetry: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ExportProgressDialog({
  open,
  progress,
  onClose,
  onCancel,
  onRetry,
}: ExportProgressDialogProps) {
  const phase = progress?.phase ?? "preparing"
  const isProcessing =
    phase === "preparing" || phase === "map-assets" || phase === "archiving"
  const isComplete = phase === "complete"
  const isError = phase === "error"

  const panelRef = useRef<HTMLDivElement>(null)
  const overlay = useOverlay("export-dialog")

  // Signal overlay active, lock scroll, and focus panel
  useEffect(() => {
    if (!open) return
    overlay.acquire()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.body.style.overflow = originalOverflow
      overlay.release()
    }
  }, [open, overlay])

  // Escape to cancel/close
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        if (isProcessing) onCancel()
        else onClose()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, isProcessing, onCancel, onClose])

  // Unified progress bar: map assets = 0–5%, photos = 5–100%
  const MAP_WEIGHT = 5
  const progressPercent =
    phase === "preparing"
      ? 0
      : phase === "map-assets"
        ? MAP_WEIGHT
        : phase === "archiving" && progress && progress.total > 0
          ? MAP_WEIGHT + Math.round((progress.current / progress.total) * (100 - MAP_WEIGHT))
          : phase === "complete"
            ? 100
            : 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (isProcessing) onCancel()
              else onClose()
            }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-dialog-title"
            tabIndex={-1}
            className="relative z-10 mx-4 w-full max-w-[420px] rounded-lg border bg-background p-6 shadow-lg outline-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                if (isProcessing) onCancel()
                else onClose()
              }}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* Header */}
            <h2 id="export-dialog-title" className="text-lg font-semibold leading-none">
              {isComplete
                ? "Export complete"
                : isError
                  ? "Export failed"
                  : "Exporting trip..."}
            </h2>

            <div className="mt-4 flex flex-col gap-4">
              {/* Unified progress bar for all processing phases */}
              {isProcessing && (
                <>
                  <Progress
                    value={progressPercent}
                    className="h-2"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    {phase === "preparing" && "Preparing export..."}
                    {phase === "map-assets" && "Packaging map assets..."}
                    {phase === "archiving" &&
                      progress &&
                      `Exporting photos... (${progress.current} / ${progress.total})`}
                  </p>
                </>
              )}

              {/* Complete state */}
              {isComplete && progress && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <CheckCircle2 className="size-10 text-success" />
                  {progress.fileSize && (
                    <p className="text-sm font-medium text-primary">
                      {formatFileSize(progress.fileSize)}
                    </p>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    Unzip the file and open index.html in your browser to view your
                    trip offline.
                  </p>
                  {progress.skippedPhotos && progress.skippedPhotos.length > 0 && (
                    <p className="text-center text-sm text-warning">
                      {progress.skippedPhotos.length} photo
                      {progress.skippedPhotos.length === 1 ? "" : "s"} could not be
                      found and {progress.skippedPhotos.length === 1 ? "was" : "were"}{" "}
                      excluded.
                    </p>
                  )}
                </div>
              )}

              {/* Error state */}
              {isError && progress && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <AlertCircle className="size-10 text-destructive" />
                  <p className="text-center text-sm text-muted-foreground">
                    {progress.errorMessage ?? "An unexpected error occurred."}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                {isProcessing && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium",
                      "text-muted-foreground transition-colors hover:text-primary",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                )}
                {isError && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className={cn(
                      "inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                      "transition-colors hover:bg-primary/90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    Try again
                  </button>
                )}
                {isComplete && (
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      "inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                      "transition-colors hover:bg-primary/90",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
