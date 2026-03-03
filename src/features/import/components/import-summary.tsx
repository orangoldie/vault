"use client"

import { CircleCheck, MapPin, ImageIcon, Calendar, Route } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDateRange } from "@/lib/format-date"
import type { ImportResult } from "@/types/import"

interface ImportSummaryProps {
  result: ImportResult
  onImportAnother: () => void
  onDone: () => void
}

function formatDistance(km: number): string {
  return km.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " km"
}

export function ImportSummary({
  result,
  onImportAnother,
  onDone,
}: ImportSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <CircleCheck className="size-12 text-success" strokeWidth={1.5} />

      <div className="flex flex-col items-center gap-1">
        <h2
          dir="auto"
          className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary"
        >
          <bdi>{result.tripName}</bdi>
        </h2>
        <p className="text-base text-muted-foreground">imported successfully</p>
      </div>

      <div className="w-full rounded-xl border border-border bg-surface p-6 shadow-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-base font-medium text-primary">
              {result.stepCount} steps
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-base font-medium text-primary">
              {result.photoCount} photos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-primary">
              {formatDateRange(result.startDate, result.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-base font-medium text-primary">
              {formatDistance(result.totalKm)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onImportAnother} className="h-11 px-6">
          Import Another
        </Button>
        <Button onClick={onDone} className="h-11 px-6">
          Done
        </Button>
      </div>
    </div>
  )
}
