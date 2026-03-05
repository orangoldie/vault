"use client"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { MapPin, Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDateRange } from "@/lib/format-date"
import { ReimportConfirmation } from "./reimport-confirmation"
import type { TripSummary } from "@/types/import"

interface TripSelectionCardProps {
  trip: TripSummary
  onSelect: () => void
  disabled: boolean
  loading: boolean
  expanded: boolean
  onCancelConfirmation: () => void
  onConfirmReimport: () => void
}

export function TripSelectionCard({
  trip,
  onSelect,
  disabled,
  loading,
  expanded,
  onCancelConfirmation,
  onConfirmReimport,
}: TripSelectionCardProps) {
  const prefersReducedMotion = useReducedMotion()

  const label = [
    trip.name,
    formatDateRange(trip.startDate, trip.endDate),
    `${trip.chapterCount} chapters`,
    trip.alreadyImported ? "already imported" : "",
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm transition-colors",
        loading && "ring-2 ring-ring"
      )}
    >
      <button
        type="button"
        className={cn(
          "w-full rounded-xl p-4 text-left transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-xl",
          disabled && !loading && "pointer-events-none opacity-50"
        )}
        onClick={onSelect}
        disabled={disabled}
        aria-label={label}
        aria-expanded={expanded}
      >
        <h3
          dir="auto"
          className="line-clamp-2 text-base font-medium text-primary"
        >
          <bdi>{trip.name}</bdi>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDateRange(trip.startDate, trip.endDate)}
        </p>
        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3.5 animate-spin" />
              Importing&hellip;
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {trip.chapterCount} chapters
            </span>
          )}
        </div>
        {trip.alreadyImported && !loading && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3" />
            Already imported
          </div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="reimport-confirmation"
            initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <ReimportConfirmation
                onCancel={onCancelConfirmation}
                onConfirm={onConfirmReimport}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
