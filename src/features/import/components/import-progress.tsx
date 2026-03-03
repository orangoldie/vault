"use client"

import { Progress } from "@/components/ui/progress"
import type { ImportProgress as ImportProgressData } from "@/types/import"

interface ImportProgressProps {
  tripName: string | null
  progress: ImportProgressData
}

export function ImportProgress({ tripName, progress }: ImportProgressProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      {tripName && (
        <h2
          dir="auto"
          className="text-2xl font-semibold leading-[1.3] tracking-[-0.015em] text-primary"
        >
          <bdi>{tripName}</bdi>
        </h2>
      )}

      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-end">
          <span className="text-sm leading-[1.5] tracking-[0.005em] text-muted-foreground">
            {progress.percent}%
          </span>
        </div>
        <Progress
          value={progress.percent}
          className="h-2 bg-surface"
          aria-label="Import progress"
        />
      </div>

      <p
        className="text-sm leading-[1.5] tracking-[0.005em] text-muted-foreground"
        aria-live="polite"
      >
        {progress.detail}
      </p>
    </div>
  )
}
