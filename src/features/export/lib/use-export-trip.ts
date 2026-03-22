"use client"

import { useState, useCallback, useRef } from "react"

import { exportTrip, type ExportProgress } from "./export-trip"

export function useExportTrip(tripId: number) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(() => {
    const controller = new AbortController()
    abortRef.current = controller
    setExporting(true)
    setProgress({ phase: "preparing", current: 0, total: 0 })

    exportTrip({
      tripId,
      onProgress: setProgress,
      signal: controller.signal,
    }).finally(() => {
      if (controller.signal.aborted) {
        setExporting(false)
        setProgress(null)
      }
    })
  }, [tripId])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setExporting(false)
    setProgress(null)
  }, [])

  const close = useCallback(() => {
    setExporting(false)
    setProgress(null)
  }, [])

  return {
    exporting,
    progress,
    start,
    cancel,
    close,
  }
}
