"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { countryCodeToFlag } from "@/lib/country-flag"
import type { Chapter } from "@/types/trip"

interface ChapterNavPillProps {
  chapters: Chapter[]
  activeIndex: number
  visible: boolean
  onNavigate: (index: number) => void
}

export function ChapterNavPill({
  chapters,
  activeIndex,
  visible,
  onNavigate,
}: ChapterNavPillProps) {
  const [expanded, setExpanded] = useState(false)
  const activeChapter = chapters[activeIndex]

  // Close popover on Escape key
  useEffect(() => {
    if (!expanded) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExpanded(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [expanded])

  // Close popover on scroll
  useEffect(() => {
    if (!expanded) return
    function handleScroll() {
      setExpanded(false)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [expanded])

  if (!activeChapter) return null

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-300 xl:hidden",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2.5",
          "bg-vault-surface/95 shadow-lg backdrop-blur-sm",
          "text-sm text-vault-text",
          "border border-border",
          "transition-colors hover:bg-surface-hover",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Chapter navigation"
      >
        <span className="size-2 rounded-full bg-vault-gold" />
        <span className="font-medium">{activeChapter.displayName}</span>
        <span className="text-muted-foreground">
          · {activeIndex + 1} of {chapters.length}
        </span>
      </button>

      {/* Expanded popover */}
      {expanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setExpanded(false)}
          />
          <div
            className={cn(
              "absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2",
              "max-h-64 w-64 overflow-y-auto rounded-lg",
              "bg-vault-surface/95 shadow-xl backdrop-blur-sm",
              "border border-border p-2"
            )}
          >
            {chapters.map((chapter, i) => {
              const flag = countryCodeToFlag(chapter.location.countryCode)
              const isActive = i === activeIndex
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => {
                    onNavigate(i)
                    setExpanded(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                    "transition-colors hover:bg-surface-hover",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "font-medium text-vault-gold"
                      : "text-vault-text"
                  )}
                >
                  {flag && <span>{flag}</span>}
                  <span className="truncate">{chapter.displayName}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
