import { formatDateRange } from "@/lib/format-date"
import type { Trip } from "@/types/trip"

import { TripStats } from "./trip-stats"

interface TripHeaderProps {
  trip: Trip
  hasCover: boolean
}

export function TripHeader({ trip, hasCover }: TripHeaderProps) {
  return (
    <section
      id="trip-header"
      aria-label="Trip summary"
      className="flex flex-col gap-4"
    >
      {!hasCover && (
        <h1
          dir="auto"
          className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary"
        >
          <bdi>{trip.name}</bdi>
        </h1>
      )}

      <p className="text-sm text-muted-foreground">
        {formatDateRange(trip.startDate, trip.endDate)}
      </p>

      {trip.summary && (
        <p
          dir="auto"
          className="whitespace-pre-line text-base leading-relaxed text-primary"
        >
          <bdi>{trip.summary}</bdi>
        </p>
      )}

      <TripStats
        chapterCount={trip.chapterCount}
        photoCount={trip.photoCount}
        totalKm={trip.totalKm}
      />
    </section>
  )
}
