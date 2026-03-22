"use client"

import { useExportTrip } from "../lib/use-export-trip"
import { useOverlayActive } from "@/features/trip-detail/lib/overlay-context"
import { ExportMenu } from "./export-menu"
import { ExportProgressDialog } from "./export-progress-dialog"

interface ExportToolbarProps {
  tripId: number
}

export function ExportToolbar({ tripId }: ExportToolbarProps) {
  const { exporting, progress, start, cancel, close } = useExportTrip(tripId)
  const overlayOpen = useOverlayActive()

  return (
    <>
      {!overlayOpen && (
        <div
          className="fixed top-4 z-30"
          style={{ right: "calc(1rem + var(--scrollbar-width, 0px))" }}
        >
          <ExportMenu onOfflineAlbum={start} />
        </div>
      )}
      <ExportProgressDialog
        open={exporting}
        progress={progress}
        onClose={close}
        onCancel={cancel}
        onRetry={start}
      />
    </>
  )
}
