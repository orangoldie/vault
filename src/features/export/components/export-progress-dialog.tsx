"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useOverlay } from "@/features/trip-detail/lib/overlay-context"
import type { UnifiedExportProgress } from "../lib/use-export-trip"

interface ExportProgressDialogProps {
  open: boolean
  progress: UnifiedExportProgress | null
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
    phase === "preparing" ||
    phase === "map-assets" ||
    phase === "archiving" ||
    phase === "composing"
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

  // Unified progress bar
  // ZIP export: preparing=0, map-assets=5%, archiving=5–100%
  // PDF export: preparing=0, composing=50% (indeterminate)
  const progressPercent = (() => {
    if (phase === "complete") return 100
    if (phase === "preparing") return 0
    // ZIP phases
    if (phase === "map-assets") return 5
    if (phase === "archiving" && progress && progress.total > 0) {
      return 5 + Math.round((progress.current / progress.total) * 95)
    }
    // PDF phases
    if (phase === "composing") return 50
    return 0
  })()

  const content = (
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
                    {phase === "composing" && "Composing album..."}
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
                    {"skippedPhotos" in progress
                      ? "Unzip the file and open index.html in your browser to view your trip offline."
                      : "Your travel album is ready."}
                  </p>
                  {"skippedPhotos" in progress &&
                    progress.skippedPhotos &&
                    progress.skippedPhotos.length > 0 && (
                      <p className="text-center text-sm text-warning">
                        {progress.skippedPhotos.length} photo
                        {progress.skippedPhotos.length === 1 ? "" : "s"} could not be
                        found and{" "}
                        {progress.skippedPhotos.length === 1 ? "was" : "were"}{" "}
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

  // Portal to document.body so the fixed overlay isn't clipped by any
  // ancestor stacking context (e.g. the site header's backdrop-filter).
  if (typeof document === "undefined") return null
  return createPortal(content, document.body)
}
