"use client"

import { useRef, useCallback } from "react"

import { useExportTrip } from "../lib/use-export-trip"
import { useOverlayActive } from "@/features/trip-detail/lib/overlay-context"
import { ExportMenu } from "./export-menu"
import { ExportProgressDialog } from "./export-progress-dialog"

interface ExportToolbarProps {
  tripId: number
}

export function ExportToolbar({ tripId }: ExportToolbarProps) {
  const { exporting, progress, startOffline, startPdf, cancel, close } =
    useExportTrip(tripId)
  const overlayOpen = useOverlayActive()
  const lastExportType = useRef<"offline" | "pdf">("offline")

  const handleOffline = useCallback(() => {
    lastExportType.current = "offline"
    startOffline()
  }, [startOffline])

  const handlePdf = useCallback(() => {
    lastExportType.current = "pdf"
    startPdf()
  }, [startPdf])

  const handleRetry = useCallback(() => {
    if (lastExportType.current === "pdf") {
      startPdf()
    } else {
      startOffline()
    }
  }, [startOffline, startPdf])

  return (
    <>
      {!overlayOpen && (
        <div
          className="fixed top-4 z-30"
          style={{ right: "calc(1rem + var(--scrollbar-width, 0px))" }}
        >
          <ExportMenu onOfflineAlbum={handleOffline} onPdfAlbum={handlePdf} />
        </div>
      )}
      <ExportProgressDialog
        open={exporting}
        progress={progress}
        onClose={close}
        onCancel={cancel}
        onRetry={handleRetry}
      />
    </>
  )
}
