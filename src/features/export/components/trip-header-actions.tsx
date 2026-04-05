"use client"

import { useRef, useCallback } from "react"

import { useExportTrip } from "../lib/use-export-trip"
import { ExportMenu } from "./export-menu"
import { ExportProgressDialog } from "./export-progress-dialog"

interface TripHeaderActionsProps {
  tripId: number
}

export function TripHeaderActions({ tripId }: TripHeaderActionsProps) {
  const { exporting, progress, startOffline, startPdf, cancel, close } =
    useExportTrip(tripId)
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
    if (lastExportType.current === "pdf") startPdf()
    else startOffline()
  }, [startOffline, startPdf])

  return (
    <>
      <ExportMenu
        variant="header"
        onOfflineAlbum={handleOffline}
        onPdfAlbum={handlePdf}
      />
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
