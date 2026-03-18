"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Calendar, Route, Camera, ChevronsDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDateRangeEditorial, formatTimeAgo, getTripDurationDays } from "@/lib/format-date"
import type { Trip, Chapter } from "@/types/trip"

import { getCountryRoute } from "../lib/country-route"
import { TRIP_SUMMARY_ID, CHAPTER_SHOWCASE_ID } from "../lib/constants"
import { CountryRoute } from "./country-route"
import { StatCountUp } from "./stat-count-up"

interface TripSummaryProps {
  trip: Trip
  chapters: Chapter[]
  hasCover: boolean
  prefersReducedMotion: boolean
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

const formatDistance = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

const STAT_ICONS = {
  duration: Calendar,
  distance: Route,
  photos: Camera,
} as const

function staggerProps(delay: number, prefersReducedMotion: boolean) {
  if (prefersReducedMotion) return {}
  return {
    initial: { opacity: 0, y: 28 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }
}

export function TripSummary({ trip, chapters, hasCover, prefersReducedMotion }: TripSummaryProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: "-30px" })
  const [anchorVisible, setAnchorVisible] = useState(true)

  const countryCodes = getCountryRoute(chapters)
  const dateLabel = formatDateRangeEditorial(trip.startDate, trip.endDate)
  const timeAgo = formatTimeAgo(trip.endDate)
  const durationDays = getTripDurationDays(trip.startDate, trip.endDate)
  const hasSummary = Boolean(trip.summary?.trim())
  const hasCountryRoute = countryCodes.length > 0

  // Fade out chapter anchor once summary scrolls out of view
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => setAnchorVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  const handleChapterAnchorClick = useCallback(() => {
    const target = document.getElementById(CHAPTER_SHOWCASE_ID)
    if (target) {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      })
    }
  }, [prefersReducedMotion])

  // Build stats list conditionally
  const stats: { value: number; formattedValue: string; label: string; key: keyof typeof STAT_ICONS }[] = []
  stats.push({
    value: durationDays,
    formattedValue: durationDays.toLocaleString("en-US"),
    label: pluralize(durationDays, "day", "days"),
    key: "duration",
  })
  if (trip.totalKm > 0) {
    stats.push({
      value: trip.totalKm,
      formattedValue: formatDistance.format(trip.totalKm),
      label: "km",
      key: "distance",
    })
  }
  if (trip.photoCount > 0) {
    stats.push({
      value: trip.photoCount,
      formattedValue: trip.photoCount.toLocaleString("en-US"),
      label: pluralize(trip.photoCount, "photo", "photos"),
      key: "photos",
    })
  }

  return (
    <section
      ref={sectionRef}
      id={TRIP_SUMMARY_ID}
      aria-label="Trip summary"
      className={cn(
        "relative z-10 flex flex-col items-center text-center",
        hasCover
          ? "mx-4 mb-10 rounded-2xl border border-border/50 bg-background px-6 pb-16 pt-10 shadow-sm sm:mx-8 sm:mb-14 sm:rounded-3xl sm:px-10 sm:pt-12"
          : "px-4 py-12 md:px-8"
      )}
    >
      {/* 1. Trip Name (only when no cover) */}
      {!hasCover && (
        <h1
          dir="auto"
          className="mb-3 font-serif text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-primary sm:text-5xl"
        >
          <bdi>{trip.name}</bdi>
        </h1>
      )}

      {/* 2. Date Range + Time Ago */}
      <motion.div
        {...staggerProps(0.1, prefersReducedMotion)}
        className="flex flex-wrap items-baseline justify-center gap-2"
      >
        <span className="text-base tracking-wide text-muted-foreground sm:text-lg">
          {dateLabel}
        </span>
        {timeAgo && (
          <span className="text-sm italic text-muted-foreground/60">· {timeAgo}</span>
        )}
      </motion.div>

      {/* 3. Country Route */}
      {hasCountryRoute && (
        <motion.div
          {...staggerProps(0.25, prefersReducedMotion)}
          className="mt-5 flex justify-center"
        >
          <CountryRoute
            countryCodes={countryCodes}
            prefersReducedMotion={prefersReducedMotion}
          />
        </motion.div>
      )}

      {/* 4. Stats Row */}
      <motion.div
        ref={statsRef}
        {...staggerProps(0.4, prefersReducedMotion)}
        className="mt-10 flex justify-center gap-12 max-sm:gap-7"
        role="list"
        aria-live="off"
      >
        {stats.map((stat, i) => {
          const Icon = STAT_ICONS[stat.key]
          return (
            <motion.div
              key={stat.key}
              role="listitem"
              aria-label={`${stat.formattedValue} ${stat.label}`}
              className="flex flex-col items-center gap-1.5"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, scale: 0.7, y: 16 },
                    animate: statsInView
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 0, scale: 0.7, y: 16 },
                    transition: {
                      delay: 0.4 + i * 0.15,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1] as const,
                    },
                  })}
            >
              <Icon className="size-5 text-vault-gold" strokeWidth={1.8} />
              <span className="text-4xl font-bold tabular-nums tracking-tight text-primary sm:text-5xl">
                <StatCountUp
                  value={stat.value}
                  duration={1400}
                  prefersReducedMotion={prefersReducedMotion}
                  paused={!statsInView}
                />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {stat.label}
              </span>
            </motion.div>
          )
        })}
      </motion.div>

      {/* 5. Summary Text */}
      {hasSummary && (
        <motion.div
          {...staggerProps(0.55, prefersReducedMotion)}
          className="mt-10 w-full max-w-lg"
        >
          <p
            dir="auto"
            className="whitespace-pre-line break-words border-s-[3px] border-accent ps-5 text-start font-serif text-lg italic leading-relaxed text-primary"
          >
            {trip.summary}
          </p>
        </motion.div>
      )}

      {/* 6. Chapter Anchor */}
      <motion.div
        {...staggerProps(0.7, prefersReducedMotion)}
        className="mt-12"
      >
        <motion.button
          onClick={handleChapterAnchorClick}
          className={cn(
            "group inline-flex flex-col items-center gap-1 rounded-full border border-border/60 px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-vault-gold/40 hover:text-vault-gold",
            anchorVisible ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          whileHover={prefersReducedMotion ? undefined : { y: 3 }}
        >
          <span>
            {chapters.length} {pluralize(chapters.length, "chapter", "chapters")}
          </span>
          <motion.span
            className="inline-block"
            animate={prefersReducedMotion ? undefined : { y: [0, 5, 0] }}
            transition={prefersReducedMotion ? undefined : {
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          >
            <ChevronsDown className="size-4" />
          </motion.span>
        </motion.button>
      </motion.div>
    </section>
  )
}
