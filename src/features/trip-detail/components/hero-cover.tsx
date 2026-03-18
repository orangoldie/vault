"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { TRIP_SUMMARY_ID } from "../lib/constants"

interface HeroCoverProps {
  coverPhotoUrl: string | null
  tripName: string
  prefersReducedMotion: boolean
}

export function HeroCover({ coverPhotoUrl, tripName, prefersReducedMotion }: HeroCoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [nearTop, setNearTop] = useState(true)

  // Show scroll hint whenever the user is near the top of the page
  useEffect(() => {
    function onScroll() {
      setNearTop(window.scrollY <= 50)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Check if the image is already cached/loaded
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [coverPhotoUrl])

  if (!coverPhotoUrl || imageFailed) {
    return null
  }

  return (
    <div className="sticky top-0 z-0 h-screen w-full overflow-hidden">
      {/* Shimmer placeholder */}
      {!imageLoaded && (
        <div
          className={cn(
            "absolute inset-0 bg-muted",
            !prefersReducedMotion && "animate-pulse"
          )}
        />
      )}

      <motion.img
        ref={imgRef}
        src={coverPhotoUrl}
        alt={`Cover photo for ${tripName}`}
        className={cn(
          "absolute inset-0 h-full w-full object-cover",
          !imageLoaded && "opacity-0"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4 }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageFailed(true)}
      />

      {/* Darkening overlay — stronger at bottom for the trip name */}
      {imageLoaded && (
        <>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        </>
      )}

      {/* Trip name centered in viewport */}
      {imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            dir="auto"
            className="max-w-[720px] px-6 text-center font-serif text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-white drop-shadow-xl sm:text-5xl md:text-6xl"
          >
            <bdi>{tripName}</bdi>
          </h1>
        </div>
      )}

      {/* Scroll hint — fades out once user scrolls, clicks to scroll to summary */}
      <AnimatePresence>
        {imageLoaded && nearTop && (
          <motion.div
            className="absolute inset-x-0 bottom-8 flex justify-center"
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => {
                const target = document.getElementById(TRIP_SUMMARY_ID)
                if (target) {
                  target.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                  })
                }
              }}
              className="flex flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
              aria-label="Scroll to trip summary"
            >
              {prefersReducedMotion ? (
                <>
                  <ChevronDown className="size-6" />
                  <ChevronDown className="-mt-4 size-6" />
                </>
              ) : (
                <motion.div
                  className="flex flex-col items-center gap-1"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="size-6" />
                  <ChevronDown className="-mt-4 size-6" />
                </motion.div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
