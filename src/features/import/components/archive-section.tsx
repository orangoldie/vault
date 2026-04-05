import Link from "next/link"
import { MapPin, ImageIcon } from "lucide-react"

import { formatDateRange } from "@/lib/format-date"
import type { Trip } from "@/types/trip"

interface ArchiveSectionProps {
  trips: Trip[]
}

export function ArchiveSection({ trips }: ArchiveSectionProps) {
  return (
    <section
      aria-labelledby="archive-heading"
      className="max-w-3xl mx-auto px-6 pb-10 sm:px-8"
    >
      <div className="mb-5 border-b border-vault-gold/15 pb-3">
        <h2
          id="archive-heading"
          className="text-xs font-medium uppercase tracking-[0.12em] text-vault-gold/70"
        >
          Your archive
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/trip/${trip.slug}`}
            className="group relative rounded-2xl border border-vault-gold/20 bg-vault-surface p-5 shadow-none transition-all duration-200 hover:border-vault-gold/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/40"
          >
            {/* Ornamental glyph */}
            <span
              className="absolute right-4 top-4 text-xs text-vault-gold/25"
              aria-hidden="true"
            >
              ◈
            </span>

            <h3
              dir="auto"
              className="font-serif text-lg font-semibold text-vault-text"
            >
              <bdi>{trip.name}</bdi>
            </h3>

            <p className="mt-1 text-sm font-light text-vault-text-dim">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>

            <div className="mt-3 flex gap-5 text-xs text-vault-text-dim">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-vault-gold/50" aria-hidden="true" />
                {trip.chapterCount} chapters
              </span>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-vault-gold/50" aria-hidden="true" />
                {trip.photoCount} photos
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
