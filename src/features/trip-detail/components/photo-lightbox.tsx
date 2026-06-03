"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Photo } from "@/types/trip"

import { useOverlay } from "../lib/overlay-context"

interface PhotoLightboxProps {
  photos: Photo[]
  photoUrls: Map<string, string>
  initialIndex: number
  chapterName: string
  onClose: () => void
}

export function PhotoLightbox({
  photos,
  photoUrls,
  initialIndex,
  chapterName,
  onClose,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const currentPhoto = photos[currentIndex]
  const currentUrl = currentPhoto ? photoUrls.get(currentPhoto.id) : undefined
  const total = photos.length

  // Store the element that triggered the lightbox so we can restore focus
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    containerRef.current?.focus()
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  // Preload adjacent photos
  useEffect(() => {
    const preloadIndices = [currentIndex - 1, currentIndex + 1].filter(
      (i) => i >= 0 && i < total
    )
    for (const idx of preloadIndices) {
      const photo = photos[idx]
      const url = photo ? photoUrls.get(photo.id) : undefined
      if (url) {
        const img = new Image()
        img.src = url
      }
    }
  }, [currentIndex, photos, photoUrls, total])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : prev))
  }, [total])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  // Keyboard navigation + focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          goPrev()
          break
        case "ArrowRight":
          goNext()
          break
        case "Tab": {
          // Focus trap: cycle focus within the dialog
          const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (!focusable || focusable.length === 0) {
            e.preventDefault()
            break
          }
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey) {
            if (document.activeElement === first || document.activeElement === containerRef.current) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
          break
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, goNext, goPrev])

  // Lock body scroll and signal overlay active
  const overlay = useOverlay("lightbox")
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    overlay.acquire()
    return () => {
      document.body.style.overflow = originalOverflow
      overlay.release()
    }
  }, [overlay])

  // Touch handling for swipe navigation
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    touchStartRef.current = null

    // Swipe down to close
    if (dy > 80 && Math.abs(dx) < Math.abs(dy)) {
      onClose()
      return
    }

    // Horizontal swipe to navigate
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  if (typeof document === "undefined") return null
  return createPortal(
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-label="Photo viewer"
      aria-roledescription="carousel"
      tabIndex={-1}
      className="group fixed inset-0 z-50 flex items-center justify-center bg-black/90 outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute top-4 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ right: "1rem" }}
      >
        <X className="size-5" />
      </button>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous photo"
          className={cn(
            "absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            "md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
          )}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < total - 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label="Next photo"
          className={cn(
            "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            "md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
          )}
          style={{ right: "1rem" }}
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Photo */}
      <div className="flex h-full w-full items-center justify-center p-4 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto?.id}
            className="relative max-h-full max-w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={`Photo ${currentIndex + 1} from ${chapterName}`}
                className="max-h-[85vh] max-w-full rounded-sm object-contain"
                draggable={false}
              />
            ) : (
              <div className="flex size-24 items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Context bar — timer-triggered on desktop, always visible on mobile */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-center"
        )}
      >
        <p className="text-sm text-white/80">
          <bdi>{chapterName}</bdi> — {currentIndex + 1} of {total}
        </p>
      </div>
    </motion.div>,
    document.body
  )
}
