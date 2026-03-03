"use client"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ImportErrorCode } from "@/types/import"

interface ImportErrorProps {
  code: ImportErrorCode
  onRetry: () => void
}

const ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  INVALID_ZIP:
    "This doesn\u2019t appear to be a ZIP file. Please select the ZIP file you downloaded from Polarsteps.",
  MISSING_TRIP_JSON:
    "No trip data was found in this file. Make sure you\u2019re selecting a Polarsteps export ZIP (it should contain a trip.json file).",
  MALFORMED_JSON:
    "The trip data in this file appears to be damaged. Try re-downloading your export from Polarsteps.",
  EMPTY_TRIP:
    "This trip doesn\u2019t contain any steps or photos to import.",
  QUOTA_EXCEEDED:
    "There isn\u2019t enough storage space to import this trip. Try closing other tabs or clearing browser data to free up space.",
  FILE_TOO_LARGE:
    "The file may be too large to process in the browser. Try a smaller export or free up system memory.",
  UNKNOWN:
    "Something went wrong during import. Please try again.",
}

export function ImportErrorView({ code, onRetry }: ImportErrorProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <AlertTriangle className="size-12 text-warning" strokeWidth={1.5} />

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-[1.125rem] font-medium leading-[1.4] tracking-[-0.01em] text-primary">
          We couldn&apos;t read this file
        </h2>
        <p className="max-w-[360px] text-base leading-[1.5] text-muted-foreground">
          {ERROR_MESSAGES[code]}
        </p>
      </div>

      <Button variant="outline" onClick={onRetry} className="h-11 px-6">
        Try Again
      </Button>
    </div>
  )
}
