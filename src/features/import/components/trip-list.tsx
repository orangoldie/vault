"use client"

import { Upload, MapPin, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDateRange } from "@/lib/format-date"
import type { Trip } from "@/types/trip"

interface TripListProps {
  trips: Trip[]
  onImport: () => void
}

export function TripList({ trips, onImport }: TripListProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <h1 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary">
        Polarsteps Vault
      </h1>

      <div className="flex w-full flex-col gap-3">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <h3
              dir="auto"
              className="text-base font-medium text-primary"
            >
              <bdi>{trip.name}</bdi>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {trip.stepCount} steps
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3.5" />
                {trip.photoCount} photos
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onImport}
        className="h-11 gap-1 px-6 text-base font-medium shadow-sm"
      >
        <Upload className="size-5" />
        Import Trip
      </Button>
    </div>
  )
}
