"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TripSelectionCard } from "./trip-selection-card"
import type { TripSummary } from "@/types/import"

interface TripSelectionListProps {
  trips: TripSummary[]
  onSelectTrip: (trip: TripSummary) => void
  onDismiss: () => void
}

export function TripSelectionList({ trips, onSelectTrip, onDismiss }: TripSelectionListProps) {
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null)
  const [loadingTripId, setLoadingTripId] = useState<number | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expandedTripId !== null) {
          setExpandedTripId(null)
        } else {
          onDismiss()
        }
      }
    },
    [expandedTripId, onDismiss]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  function handleCardSelect(trip: TripSummary) {
    if (loadingTripId !== null) return

    if (trip.alreadyImported && expandedTripId !== trip.id) {
      setExpandedTripId(trip.id)
      return
    }

    setLoadingTripId(trip.id)
    setExpandedTripId(null)
    onSelectTrip(trip)
  }

  function handleConfirmReimport(trip: TripSummary) {
    setLoadingTripId(trip.id)
    setExpandedTripId(null)
    onSelectTrip(trip)
  }

  const alreadyImportedCount = trips.filter((t) => t.alreadyImported).length

  const subtitle =
    alreadyImportedCount > 0
      ? `Found ${trips.length} trips in your export (${alreadyImportedCount} already in your vault)`
      : `Found ${trips.length} trips in your export`

  return (
    <div className="flex w-full flex-col">
      <div className="relative mb-6 flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-0 top-0"
          onClick={onDismiss}
          aria-label="Close trip selection"
        >
          <X className="size-5" />
        </Button>

        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-[1.125rem] font-medium text-primary outline-none"
        >
          Select a trip
        </h2>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {trips.map((trip) => (
          <TripSelectionCard
            key={trip.id}
            trip={trip}
            onSelect={() => handleCardSelect(trip)}
            disabled={loadingTripId !== null && loadingTripId !== trip.id}
            loading={loadingTripId === trip.id}
            expanded={expandedTripId === trip.id}
            onCancelConfirmation={() => setExpandedTripId(null)}
            onConfirmReimport={() => handleConfirmReimport(trip)}
          />
        ))}
      </div>
    </div>
  )
}
