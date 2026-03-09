"use client"

import { useEffect, useRef, useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { countryCodeToFlag } from "@/lib/country-flag"
import type { Chapter } from "@/types/trip"

interface ChapterNavSidebarProps {
  chapters: Chapter[]
  activeIndex: number
  visible: boolean
  onNavigate: (index: number) => void
}

export function ChapterNavSidebar({
  chapters,
  activeIndex,
  visible,
  onNavigate,
}: ChapterNavSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<Map<number, HTMLButtonElement>>(new Map())
  const [progressHeight, setProgressHeight] = useState(0)

  const setDotRef = useCallback((index: number, el: HTMLButtonElement | null) => {
    if (el) {
      dotRefs.current.set(index, el)
    } else {
      dotRefs.current.delete(index)
    }
  }, [])

  // Scroll active chapter into view within the sidebar
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    })
  }, [activeIndex])

  // Measure the active dot's position relative to the first dot.
  // Both dots share the same scroll container, so scroll offset cancels out.
  useEffect(() => {
    const firstDot = dotRefs.current.get(0)
    const activeDot = dotRefs.current.get(activeIndex)
    if (!firstDot || !activeDot) {
      setProgressHeight(0)
      return
    }
    const firstOffset = firstDot.offsetTop
    const activeOffset = activeDot.offsetTop
    const dotHeight = activeDot.offsetHeight
    setProgressHeight(activeOffset - firstOffset + dotHeight / 2)
  }, [activeIndex])

  return (
    <nav
      aria-label="Chapter navigation"
      className={cn(
        "fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 transition-opacity duration-300 xl:block",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div
        ref={scrollRef}
        className="relative flex max-h-[80vh] flex-col gap-0 overflow-y-auto scrollbar-none"
      >
        {/* Gold gradient progress line behind all nodes */}
        {chapters.length > 1 && (
          <div
            className="absolute left-[5px] top-[6px] w-px"
            style={{ height: `calc(100% - 12px)` }}
            aria-hidden="true"
          >
            {/* Track background */}
            <div className="absolute inset-0 bg-vault-gold-dim/30" />
            {/* Active fill — pixel-positioned to the active dot */}
            <div
              className="absolute inset-x-0 top-0 bg-gradient-to-b from-vault-gold to-vault-gold transition-all duration-300 ease-out"
              style={{ height: `${progressHeight}px` }}
            />
          </div>
        )}

        {chapters.map((chapter, i) => {
          const isPast = i < activeIndex
          const isActive = i === activeIndex
          const flag = countryCodeToFlag(chapter.location.countryCode)

          // Truncate long names
          const name =
            chapter.displayName.length > 20
              ? chapter.displayName.slice(0, 20) + "…"
              : chapter.displayName

          return (
            <div
              key={chapter.id}
              ref={isActive ? activeRef : undefined}
              className="flex items-start gap-3"
            >
              {/* Dot + spacer (line is now rendered as a single background element) */}
              <div className="flex flex-col items-center">
                <button
                  ref={(el) => setDotRef(i, el)}
                  type="button"
                  onClick={() => onNavigate(i)}
                  aria-label={`Go to ${chapter.displayName}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative z-10 size-3 rounded-full border-2 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive &&
                      "border-vault-gold bg-vault-gold shadow-[0_0_6px_rgba(162,107,40,0.4)]",
                    isPast && !isActive && "border-vault-gold bg-vault-gold",
                    !isPast && !isActive && "border-vault-gold-dim bg-transparent"
                  )}
                />
                {/* Spacer to maintain gap between nodes */}
                {i < chapters.length - 1 && (
                  <div className="h-8 w-px" />
                )}
              </div>

              {/* Label */}
              <button
                type="button"
                onClick={() => onNavigate(i)}
                className={cn(
                  "mt-[-2px] text-left text-xs leading-tight transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:underline",
                  isActive
                    ? "font-medium text-vault-gold"
                    : isPast
                      ? "text-vault-text"
                      : "text-vault-text-dim"
                )}
              >
                {flag && <span className="mr-1">{flag}</span>}
                {name}
              </button>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
