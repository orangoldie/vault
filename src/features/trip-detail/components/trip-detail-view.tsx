"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import type { StyleSpecification } from "maplibre-gl"

import type { Trip, Chapter } from "@/types/trip"

import { TRIP_SUMMARY_ID } from "../lib/constants"
import { HeroCover } from "./hero-cover"
import { TripSummary } from "./trip-summary"
import { ChapterShowcase } from "./chapter-showcase"
import { TripGlobe } from "./trip-globe"
import { ScrollToTopButton } from "./scroll-to-top-button"

export interface TripDetailViewProps {
  trip: Trip
  chapters: Chapter[]
  coverPhotoUrl?: string | null
  photoCountsByChapter: Map<number, number>
  /** Called when the summary section scrolls out of / back into view. */
  onPastSummary?: (past: boolean) => void
  /** Override globe map style (used by the export viewer for offline assets). */
  mapStyle?: StyleSpecification
}

export function TripDetailView({
  trip,
  chapters,
  coverPhotoUrl,
  photoCountsByChapter,
  onPastSummary,
  mapStyle,
}: TripDetailViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shieldRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [globeActiveIndex, setGlobeActiveIndex] = useState(0)
  const [globeVisible, setGlobeVisible] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Focus management — focus the heading on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      const h1 = containerRef.current?.querySelector("h1")
      if (h1) {
        h1.setAttribute("tabindex", "-1")
        h1.focus()
      }
    })
  }, [])

  // Show globe only after the summary section has scrolled out of view
  useEffect(() => {
    const summary = document.getElementById(TRIP_SUMMARY_ID)
    if (!summary) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting
        setGlobeVisible(past)
        onPastSummary?.(past)
      },
      { threshold: 0 }
    )
    observer.observe(summary)
    return () => observer.disconnect()
  }, [])

  const handleActiveIndexChange = useCallback((index: number) => {
    setGlobeActiveIndex(index)
  }, [])

  const handleGlobeNavigate = useCallback(
    (index: number) => {
      setGlobeActiveIndex(index)
    },
    []
  )

  // JS fallback for the hero shield in browsers without scroll-driven animations.
  useEffect(() => {
    if (!coverPhotoUrl) return
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline", "scroll()")) return

    const shield = shieldRef.current
    if (!shield) return

    const FADE_START = 1.2
    const FADE_END = 1.8

    function onScroll() {
      const vh = window.innerHeight
      const progress = Math.min(
        1,
        Math.max(0, (window.scrollY - vh * FADE_START) / (vh * (FADE_END - FADE_START)))
      )
      shield!.style.opacity = String(progress)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [coverPhotoUrl])

  const hasCover = Boolean(coverPhotoUrl)

  const fadeProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 } as const,
        animate: { opacity: 1 } as const,
        transition: { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const },
      }

  const unfoldProps = prefersReducedMotion
    ? {}
    : {
        initial: {
          clipPath: "inset(0 49.5% 0 49.5%)",
          opacity: 0,
        } as const,
        animate: {
          clipPath: "inset(0 0% 0 0%)",
          opacity: 1,
        } as const,
        transition: {
          clipPath: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
          opacity: { duration: 0.3, delay: 0.15, ease: "easeOut" as const },
        },
      }

  return (
    <div ref={containerRef} aria-live="polite">
      {/* Skip to content link */}
      <a
        href="#trip-summary"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-40 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {hasCover && (
        <>
          <HeroCover
            coverPhotoUrl={coverPhotoUrl ?? null}
            tripName={trip.name}
            prefersReducedMotion={prefersReducedMotion}
          />
          <div
            ref={shieldRef}
            aria-hidden="true"
            className="hero-shield pointer-events-none fixed inset-x-0 top-0 z-[1] h-screen bg-background opacity-0"
          />
        </>
      )}

      <motion.div {...(hasCover ? unfoldProps : fadeProps)} className={hasCover ? "relative z-10" : "pt-14"}>
        <div className="mx-auto w-full max-w-[720px]">
          <TripSummary
            trip={trip}
            chapters={chapters}
            hasCover={hasCover}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
        <ChapterShowcase
          chapters={chapters}
          photoCountsByChapter={photoCountsByChapter}
          onActiveIndexChange={handleActiveIndexChange}
        />
        <TripGlobe
          chapters={chapters}
          activeIndex={globeActiveIndex}
          visible={globeVisible}
          onNavigate={handleGlobeNavigate}
          mapStyle={mapStyle}
        />
      </motion.div>
      <ScrollToTopButton prefersReducedMotion={prefersReducedMotion} />
    </div>
  )
}
