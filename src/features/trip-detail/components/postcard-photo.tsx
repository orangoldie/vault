"use client"

import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"
import { seededRandom } from "@/lib/seeded-random"

interface PostcardPhotoProps {
  photoId: string
  url: string | undefined
  chapterName: string
  index: number
  totalCount: number
  onClick?: (() => void) | undefined
}

export function PostcardPhoto({
  photoId,
  url,
  chapterName,
  index,
  totalCount,
  onClick,
}: PostcardPhotoProps) {
  const prefersReducedMotion = useReducedMotion()
  const rand = seededRandom(photoId)
  // Rotation between -4 and +4 degrees, 0 for single photo
  const rotation = totalCount === 1 ? 0 : (rand - 0.5) * 8

  const isPlaceholder = !url

  return (
    <motion.button
      onClick={isPlaceholder ? undefined : onClick}
      type="button"
      aria-label={isPlaceholder ? undefined : `Photo ${index + 1} from ${chapterName}`}
      aria-hidden={isPlaceholder ? true : undefined}
      tabIndex={isPlaceholder ? -1 : undefined}
      className={cn(
        "group relative w-full border-none bg-transparent p-0",
        "rounded-sm",
        isPlaceholder
          ? "pointer-events-none cursor-default"
          : "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
      style={prefersReducedMotion ? undefined : { rotate: rotation }}
      whileHover={
        prefersReducedMotion || isPlaceholder
          ? undefined
          : {
              rotate: 0,
              scale: 1.05,
              y: -8,
              zIndex: 10,
              transition: { duration: 0.2, ease: "easeOut" },
            }
      }
    >
      {/* Polaroid frame */}
      <div
        className={cn(
          "overflow-hidden rounded-sm shadow-md transition-shadow duration-200",
          "bg-[hsl(0_0%_98%)] dark:bg-[hsl(30_6%_20%)]",
          isPlaceholder ? "" : "group-hover:shadow-xl",
          "pt-2 px-2 pb-5"
        )}
      >
        {isPlaceholder ? (
          <div className="aspect-[4/3] w-full animate-pulse rounded-xs bg-muted" />
        ) : (
          <img
            src={url}
            alt={`Photo ${index + 1} from ${chapterName}`}
            className="aspect-[4/3] w-full rounded-xs object-cover"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </motion.button>
  )
}
