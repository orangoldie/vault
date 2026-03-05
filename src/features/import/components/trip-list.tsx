"use client"

import { useRef } from "react"
import Link from "next/link"
import { Upload, MapPin, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatDateRange } from "@/lib/format-date"
import type { Trip } from "@/types/trip"

interface TripListProps {
  trips: Trip[]
  onFileSelected: (file: File) => void
}

export function TripList({ trips, onFileSelected }: TripListProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
      e.target.value = ""
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <h1 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary">
        Journey Vault
      </h1>

      <div className="flex w-full flex-col gap-3">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trip/${trip.slug}`}
            className="w-full rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                {trip.chapterCount} chapters
              </span>
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3.5" />
                {trip.photoCount} photos
              </span>
            </div>
          </Link>
        ))}
      </div>

      <Button
        onClick={handleClick}
        className="h-11 gap-1 px-6 text-base font-medium shadow-sm"
      >
        <Upload className="size-5" />
        Import Trip
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleChange}
        className="hidden"
        aria-label="Select travel export ZIP file"
      />
    </div>
  )
}
