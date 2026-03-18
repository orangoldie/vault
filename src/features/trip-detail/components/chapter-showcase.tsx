"use client"

import { Component, useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

import type { Chapter } from "@/types/trip"

import { useChapterPhotos } from "../lib/use-chapter-photos"
import { TRIP_SUMMARY_ID } from "../lib/constants"
import { ChapterSection } from "./chapter-section"
import { ChapterNavSidebar } from "./chapter-nav-sidebar"
import { ChapterNavPill } from "./chapter-nav-pill"
import { RouteLine } from "./route-line"

/** Fraction of viewport height excluded from the top of the observer hot zone. */
const ACTIVE_ZONE_TOP_INSET = 0.02
/** Navigate scroll offset — slightly past the inset so the sentinel lands inside the hot zone. */
const NAVIGATE_SCROLL_INSET = ACTIVE_ZONE_TOP_INSET + 0.01

interface ChapterShowcaseProps {
  chapters: Chapter[]
  photoCountsByChapter: Map<number, number>
  onActiveIndexChange?: (index: number) => void
}

/** Error boundary that catches render errors in individual chapters. */
class ChapterErrorBoundary extends Component<
  { chapterName: string; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { chapterName: string; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="py-8 md:py-14">
          <div className="mx-auto w-full max-w-[720px] px-4 md:px-8">
            <p className="text-sm text-muted-foreground">
              Could not display chapter &ldquo;{this.props.chapterName}&rdquo;.
            </p>
          </div>
        </section>
      )
    }
    return this.props.children
  }
}

/**
 * Per-chapter photo state holder.
 * Each chapter gets its own instance of useChapterPhotos, triggered lazily.
 */
function ChapterWithPhotos({
  chapter,
  photoCount,
  shouldLoad,
  shouldEvict,
  isPinned,
  onLightboxChange,
}: {
  chapter: Chapter
  photoCount: number
  shouldLoad: boolean
  shouldEvict: boolean
  isPinned: boolean
  onLightboxChange: (chapterId: number | null) => void
}) {
  const { photos, photoUrls, status, load, revoke } = useChapterPhotos(chapter.id)

  useEffect(() => {
    if (shouldLoad && status === "idle") {
      load()
    }
  }, [shouldLoad, status, load])

  // Evict URLs when chapter scrolls far away — but never while its lightbox is open
  useEffect(() => {
    if (shouldEvict && !isPinned) {
      revoke()
    }
  }, [shouldEvict, isPinned, revoke])

  return (
    <ChapterErrorBoundary chapterName={chapter.displayName}>
      <ChapterSection
        chapter={chapter}
        photos={photos}
        photoUrls={photoUrls}
        photoCount={photoCount}
        onLightboxChange={onLightboxChange}
      />
    </ChapterErrorBoundary>
  )
}

export function ChapterShowcase({ chapters, photoCountsByChapter, onActiveIndexChange }: ChapterShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [navVisible, setNavVisible] = useState(false)
  const [loadableChapters, setLoadableChapters] = useState<Set<number>>(
    new Set()
  )
  const [evictableChapters, setEvictableChapters] = useState<Set<number>>(
    new Set()
  )
  const [pinnedChapterId, setPinnedChapterId] = useState<number | null>(null)
  const showcaseRef = useRef<HTMLDivElement>(null)

  const handleLightboxChange = useCallback((chapterId: number | null) => {
    setPinnedChapterId(chapterId)
  }, [])

  // Track which chapter is active via IntersectionObserver on sentinels
  useEffect(() => {
    const sentinels = showcaseRef.current?.querySelectorAll(
      "[data-chapter-sentinel]"
    )
    if (!sentinels || sentinels.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1
        let bestTop = Infinity

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const distFromTop = Math.abs(entry.boundingClientRect.top)
            if (distFromTop < bestTop) {
              bestTop = distFromTop
              const id = Number(
                (entry.target as HTMLElement).dataset.chapterId
              )
              const idx = chapters.findIndex((c) => c.id === id)
              if (idx !== -1) bestIdx = idx
            }
          }
        }
        if (bestIdx !== -1) {
          setActiveIndex(bestIdx)
          onActiveIndexChange?.(bestIdx)
        }
      },
      {
        rootMargin: `-${ACTIVE_ZONE_TOP_INSET * 100}% 0px -80% 0px`,
        threshold: 0,
      }
    )

    sentinels.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [chapters])

  // Show nav only after the summary section has scrolled out of view
  useEffect(() => {
    const summary = document.getElementById(TRIP_SUMMARY_ID)
    if (!summary) {
      setNavVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNavVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(summary)
    return () => observer.disconnect()
  }, [])

  // Track which chapters should load photos and which should be evicted.
  // Observes the full <section> elements (not zero-height sentinels) so that
  // scrolling UP into a photo-heavy chapter triggers loading when the bottom
  // of the section enters the margin — not only when the top sentinel does.
  useEffect(() => {
    const sections = showcaseRef.current?.querySelectorAll(
      "[data-chapter-section]"
    )
    if (!sections || sections.length === 0) return

    const nearViewport = new Set<number>()
    const farFromViewport = new Set<number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = Number(
            (entry.target as HTMLElement).dataset.chapterId
          )
          if (entry.isIntersecting) {
            nearViewport.add(id)
            farFromViewport.delete(id)
          } else {
            nearViewport.delete(id)
            farFromViewport.add(id)
          }
        }
        setLoadableChapters(new Set(nearViewport))
        setEvictableChapters(new Set(farFromViewport))
      },
      {
        rootMargin: "300% 0px",
        threshold: 0,
      }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [chapters])

  const handleNavigate = useCallback(
    (index: number) => {
      const sentinel = showcaseRef.current?.querySelector(
        `[data-chapter-id="${chapters[index]?.id}"]`
      )
      if (!sentinel) return
      // Scroll the sentinel to ~15% from the top of the viewport,
      // which lands it inside the observer's hot zone (-10% to -80%)
      const y = sentinel.getBoundingClientRect().top + window.scrollY - window.innerHeight * NAVIGATE_SCROLL_INSET
      window.scrollTo({ top: y, behavior: "smooth" })
    },
    [chapters]
  )

  if (chapters.length === 0) {
    return (
      <p className="py-12 text-center text-base text-muted-foreground">
        No chapters recorded for this trip.
      </p>
    )
  }

  return (
    <>
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={activeIndex}
        visible={navVisible}
        onNavigate={handleNavigate}
      />
      <ChapterNavPill
        chapters={chapters}
        activeIndex={activeIndex}
        visible={navVisible}
        onNavigate={handleNavigate}
      />

      <div ref={showcaseRef} id="chapter-showcase" className="bg-background pt-4">
        {chapters.map((chapter, index) => (
          <div key={chapter.id}>
            {index > 0 && <RouteLine />}
            <ChapterWithPhotos
              chapter={chapter}
              photoCount={photoCountsByChapter.get(chapter.id) ?? 0}
              shouldLoad={loadableChapters.has(chapter.id)}
              shouldEvict={evictableChapters.has(chapter.id)}
              isPinned={pinnedChapterId === chapter.id}
              onLightboxChange={handleLightboxChange}
            />
          </div>
        ))}
      </div>
    </>
  )
}
