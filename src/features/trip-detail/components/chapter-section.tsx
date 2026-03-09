"use client"

import { useCallback, useState } from "react"
import { AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { countryFlagClass } from "@/lib/country-flag"
import { formatDate, formatDateRange } from "@/lib/format-date"
import type { Chapter, Photo } from "@/types/trip"

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

function formatWeather(chapter: Chapter): string | null {
  const parts: string[] = []
  if (chapter.weatherCondition) {
    parts.push(chapter.weatherCondition)
  }
  if (chapter.weatherTemperature != null) {
    parts.push(`${Math.round(chapter.weatherTemperature)}\u00B0C`)
  }
  return parts.length > 0 ? parts.join(", ") : null
}

export function ChapterSection({
  chapter,
  photos,
  photoUrls,
  photoCount = 0,
  onLightboxChange,
}: ChapterSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const flagClass = countryFlagClass(chapter.location.countryCode)
  const weather = formatWeather(chapter)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    onLightboxChange?.(chapter.id)
  }, [chapter.id, onLightboxChange])

  return (
    <section
      aria-label={`Chapter: ${chapter.displayName}`}
      data-chapter-section
      data-chapter-id={chapter.id}
      className="py-8 md:py-14"
    >
      {/* Sentinel for IntersectionObserver */}
      <div data-chapter-sentinel data-chapter-id={chapter.id} className="h-0" />

      {/* Content column */}
      <div className="mx-auto w-full max-w-[720px] px-4 md:px-8">
        {/* Metadata bar */}
        <div className="flex flex-col gap-1">
          <h2
            dir="auto"
            className="font-serif text-2xl font-semibold leading-tight text-primary md:text-3xl"
          >
            <bdi>{chapter.displayName}</bdi>
          </h2>

          {chapter.location.detail && (
            <p className="text-sm text-muted-foreground">
              {flagClass && <span className={`${flagClass} mr-1.5 inline-block size-4`} />}
              {chapter.location.detail}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {formatChapterDate(chapter)}
            {weather && (
              <span className="ml-2 before:mr-2 before:content-['·']">
                {weather}
              </span>
            )}
          </p>
        </div>

        {/* Description */}
        {chapter.description && (
          <p
            dir="auto"
            className={cn(
              "mt-6 whitespace-pre-line text-base leading-relaxed text-primary"
            )}
          >
            <bdi>{chapter.description}</bdi>
          </p>
        )}

        {/* Photo spread — all photos treated equally */}
        <PostcardGrid
          photos={photos}
          photoUrls={photoUrls}
          photoCount={photoCount}
          chapterName={chapter.displayName}
          onPhotoClick={openLightbox}
        />
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
