"use client"

import { useCallback, useRef, useState } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

import { countryFlagClass } from "@/lib/country-flag"
import { formatDate, formatDateRange } from "@/lib/format-date"
import type { Chapter, Photo } from "@/types/trip"

import { getWeatherIcon } from "../lib/weather-icon"
import { PostcardGrid } from "./postcard-grid"
import { PhotoLightbox } from "./photo-lightbox"

interface ChapterSectionProps {
  chapter: Chapter
  photos: Photo[]
  photoUrls: Map<string, string>
  photoCount?: number
  onLightboxChange?: (chapterId: number | null) => void
}

function formatChapterDate(chapter: Chapter): string {
  if (chapter.endTime && chapter.endTime !== chapter.startTime) {
    return formatDateRange(chapter.startTime, chapter.endTime)
  }
  return formatDate(chapter.startTime)
}

function hasWeather(chapter: Chapter): boolean {
  return chapter.weatherCondition != null || chapter.weatherTemperature != null
}

const entranceVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
} as const

export function ChapterSection({
  chapter,
  photos,
  photoUrls,
  photoCount = 0,
  onLightboxChange,
}: ChapterSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(contentRef, { once: true, margin: "-10% 0px" })

  const flagClass = countryFlagClass(chapter.location.countryCode)
  const WeatherIcon = chapter.weatherCondition
    ? getWeatherIcon(chapter.weatherCondition)
    : null
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    onLightboxChange?.(chapter.id)
  }, [chapter.id, onLightboxChange])

  return (
    <section
      aria-label={`Chapter: ${chapter.displayName}`}
      data-chapter-section
      data-chapter-id={chapter.id}
      className="px-4 md:px-8"
    >
      {/* Sentinel for IntersectionObserver */}
      <div data-chapter-sentinel data-chapter-id={chapter.id} className="h-0" />

      {/* Content column — card box */}
      <div ref={contentRef} className="mx-auto w-full max-w-[720px] rounded-lg border border-border/60 bg-vault-surface/30 px-4 py-6 md:px-8 md:py-8">
        {/* Metadata bar — entrance animation */}
        <motion.div
          dir="auto"
          className="flex flex-col gap-1"
          variants={entranceVariants}
          initial={prefersReducedMotion ? "visible" : "hidden"}
          animate={isInView ? "visible" : "hidden"}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="font-serif text-2xl font-semibold leading-tight text-primary md:text-3xl"
          >
            {chapter.displayName}
          </h2>

          <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            {chapter.location.detail && (
              <span className="inline-flex items-center">
                {flagClass && <span className={`${flagClass} me-1.5 inline-block size-4`} />}
                {chapter.location.detail}
              </span>
            )}
            <span className={chapter.location.detail ? "before:me-1 before:content-['·']" : ""}>
              {formatChapterDate(chapter)}
            </span>
            {hasWeather(chapter) && (
              <span className="inline-flex items-center gap-1 before:me-1 before:content-['·']">
                {WeatherIcon && (
                  <WeatherIcon
                    className="size-3.5 text-muted-foreground"
                    aria-label={chapter.weatherCondition!.replace(/-/g, " ").replace(/\b(day|night)\b/, "").trim()}
                  />
                )}
                {chapter.weatherTemperature != null && (
                  <span>{Math.round(chapter.weatherTemperature)}°C</span>
                )}
              </span>
            )}
          </p>
        </motion.div>

        {/* Description — entrance animation with slight delay */}
        {chapter.description && (
          <motion.p
            dir="auto"
            className="mt-6 whitespace-pre-line text-base leading-relaxed text-primary"
            variants={entranceVariants}
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate={isInView ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {chapter.description}
          </motion.p>
        )}

        {/* Photo spread — staggered entrance */}
        <motion.div
          variants={entranceVariants}
          initial={prefersReducedMotion ? "visible" : "hidden"}
          animate={isInView ? "visible" : "hidden"}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <PostcardGrid
            photos={photos}
            photoUrls={photoUrls}
            photoCount={photoCount}
            chapterName={chapter.displayName}
            onPhotoClick={openLightbox}
          />
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <PhotoLightbox
            photos={photos}
            photoUrls={photoUrls}
            initialIndex={lightboxIndex}
            chapterName={chapter.displayName}
            onClose={() => {
              setLightboxIndex(null)
              onLightboxChange?.(null)
            }}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
