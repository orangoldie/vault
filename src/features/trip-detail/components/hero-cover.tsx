"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface HeroCoverProps {
  coverPhotoUrl: string | null
  tripName: string
}

export function HeroCover({ coverPhotoUrl, tripName }: HeroCoverProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
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
    <div className="relative w-full overflow-hidden">
      <div className="relative aspect-[16/9] w-full md:max-h-[60vh]">
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
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
        />

        {/* Gradient overlay for text legibility */}
        {imageLoaded && (
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
        )}

        {/* Trip name overlaid on the hero */}
        {imageLoaded && (
          <h1
            dir="auto"
            className="absolute bottom-6 left-6 right-6 text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-white md:left-1/2 md:max-w-[720px] md:-translate-x-1/2 md:px-8"
          >
            <bdi>{tripName}</bdi>
          </h1>
        )}
      </div>
    </div>
  )
}
