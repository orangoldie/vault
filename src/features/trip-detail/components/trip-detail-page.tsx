"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { useTripDetail } from "../lib/use-trip-detail"
import { TRIP_SUMMARY_ID } from "../lib/constants"
import { HeroCover } from "./hero-cover"
import { TripSummary } from "./trip-summary"
import { ChapterShowcase } from "./chapter-showcase"
import { TripGlobe } from "./trip-globe"
import { TripNotFound } from "./trip-not-found"
import { TripDetailError } from "./trip-detail-error"
import { TripDetailSkeleton } from "./trip-detail-skeleton"
import { ScrollToTopButton } from "./scroll-to-top-button"

interface TripDetailPageProps {
  slug: string
}

export function TripDetailPage({ slug }: TripDetailPageProps) {
  const { status, trip, chapters, coverPhotoUrl, photoCountsByChapter, retry } = useTripDetail(slug)
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

  // Focus management after state transitions
  useEffect(() => {
    if (
      status === "success" ||
      status === "not-found" ||
      status === "error"
    ) {
      requestAnimationFrame(() => {
        const h1 = containerRef.current?.querySelector("h1")
        if (h1) {
          h1.setAttribute("tabindex", "-1")
          h1.focus()
        }
      })
    }
  }, [status])

  // Show globe only after the summary section has scrolled out of view
  useEffect(() => {
    const summary = document.getElementById(TRIP_SUMMARY_ID)
    if (!summary) return

    const observer = new IntersectionObserver(
      ([entry]) => setGlobeVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(summary)
    return () => observer.disconnect()
  }, [status])

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
  // CSS `animation-timeline: scroll()` is preferred (compositor-driven, zero latency);
  // this listener only runs when CSS support is absent.
  useEffect(() => {
    if (!coverPhotoUrl) return
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline", "scroll()")) return

    const shield = shieldRef.current
    if (!shield) return

    const FADE_START = 1.2 // start at 120vh scroll
    const FADE_END = 1.8   // fully opaque at 180vh scroll

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

  // Paper-unfold entrance via clip-path: reveals content from a narrow
  // vertical strip outward without distorting layout.
  // `initial` only applies on mount, so re-renders won't replay it.
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
          clipPath: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3, delay: 0.15, ease: "easeOut" },
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

      {status === "loading" && <TripDetailSkeleton />}

      {status === "not-found" && (
        <motion.div {...fadeProps}>
          <TripNotFound />
        </motion.div>
      )}

      {status === "error" && (
        <motion.div {...fadeProps}>
          <TripDetailError onRetry={retry} />
        </motion.div>
      )}

      {status === "success" && trip && chapters && (
        <>
          {hasCover && (
            <>
              <HeroCover
                coverPhotoUrl={coverPhotoUrl ?? null}
                tripName={trip.name}
                prefersReducedMotion={prefersReducedMotion}
              />
              {/* Hero shield: solid-color layer at z-[1] between the sticky hero (z-0)
                  and the content wrapper (z-10). Prevents the hero photo from bleeding
                  through during fast scroll in Firefox/Edge — the compositor can always
                  paint this trivial element even when complex content tiles lag behind.
                  Opacity is scroll-driven via CSS (or JS fallback) so the hero remains
                  fully visible during the summary-card parallax zone. */}
              <div
                ref={shieldRef}
                aria-hidden="true"
                className="hero-shield pointer-events-none fixed inset-x-0 top-0 z-[1] h-screen bg-background opacity-0"
              />
            </>
          )}

          {/* Summary + chapters sit above the sticky hero via z-10 */}
          <motion.div {...unfoldProps} className={hasCover ? "relative z-10" : ""}>
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
              photoCountsByChapter={photoCountsByChapter ?? new Map()}
              onActiveIndexChange={handleActiveIndexChange}
            />
            <TripGlobe
              chapters={chapters}
              activeIndex={globeActiveIndex}
              visible={globeVisible}
              onNavigate={handleGlobeNavigate}
            />
          </motion.div>
          <ScrollToTopButton prefersReducedMotion={prefersReducedMotion} />
        </>
      )}
    </div>
  )
}
