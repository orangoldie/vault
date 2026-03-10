"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import maplibregl from "maplibre-gl"
import { Protocol } from "pmtiles"
import { Map, Marker } from "@vis.gl/react-maplibre"
import "maplibre-gl/dist/maplibre-gl.css"

import type { Chapter } from "@/types/trip"
import { cn } from "@/lib/utils"

import { createGlobeStyle } from "../lib/globe-style"

// Ensure PMTiles protocol is registered
let protocolRegistered = false
function ensureProtocol() {
  if (protocolRegistered) return
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)
  protocolRegistered = true
}

interface GlobeOverlayProps {
  chapters: Chapter[]
  activeIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

const NAVIGATE_SCROLL_INSET = 0.03

function scrollToChapter(chapters: Chapter[], index: number) {
  const chapter = chapters[index]
  if (!chapter) return
  const sentinel = document.querySelector(
    `[data-chapter-id="${chapter.id}"]`
  )
  if (!sentinel) return
  const y =
    sentinel.getBoundingClientRect().top +
    window.scrollY -
    window.innerHeight * NAVIGATE_SCROLL_INSET
  window.scrollTo({ top: y, behavior: "smooth" })
}

export function GlobeOverlay({
  chapters,
  activeIndex,
  onNavigate,
  onClose,
}: GlobeOverlayProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    ensureProtocol()
  }, [])

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [])

  // Fly to active chapter when overlay opens
  useEffect(() => {
    if (!mapReady || !mapRef.current || chapters.length === 0) return
    const active = chapters[activeIndex]?.location
    if (active) {
      mapRef.current.flyTo({
        center: [active.lon, active.lat],
        zoom: 3.5,
        duration: 800,
      })
    }
  }, [mapReady, chapters, activeIndex])

  // Fly to selected chapter
  useEffect(() => {
    if (!mapReady || !mapRef.current || selectedIndex === null) return
    const loc = chapters[selectedIndex]?.location
    if (loc) {
      mapRef.current.flyTo({
        center: [loc.lon, loc.lat],
        zoom: 3.5,
        duration: 600,
      })
    }
  }, [mapReady, selectedIndex, chapters])

  const style = useMemo(() => createGlobeStyle("vault"), [])

  const handleLoad = useCallback((e: maplibregl.MapLibreEvent) => {
    const map = e.target
    mapRef.current = map
    map.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    setMapReady(true)
  }, [])

  const handlePinClick = useCallback(
    (index: number) => {
      setSelectedIndex((prev) => (prev === index ? null : index))
    },
    []
  )

  const handleSidebarClick = useCallback(
    (index: number) => {
      setSelectedIndex((prev) => (prev === index ? null : index))
    },
    []
  )

  const handleGoToChapter = useCallback(
    (index: number) => {
      onClose()
      requestAnimationFrame(() => {
        scrollToChapter(chapters, index)
        onNavigate(index)
      })
    },
    [chapters, onNavigate, onClose]
  )

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const activeChapter = chapters[activeIndex]
  const highlightedIndex = selectedIndex ?? activeIndex

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        role="dialog"
        aria-label="Trip globe view"
        onClick={handleBackdropClick}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close globe view"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Globe container */}
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chapter list sidebar — positioned to the left of the globe */}
          <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 hidden max-h-[70vh] w-56 overflow-y-auto rounded-xl bg-[hsl(30,10%,15%)] border border-white/10 p-4 scrollbar-hidden md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-vault-gold-dim">
              Chapters
            </p>
            {chapters.map((ch, i) => (
              <div key={ch.id} className="flex flex-col">
                <button
                  onClick={() => handleSidebarClick(i)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === highlightedIndex
                      ? "bg-vault-gold/20 text-vault-gold"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  )}
                >
                  <span
                    className={cn(
                      "fi h-3.5 w-5 shrink-0 rounded-sm",
                      `fi-${ch.location.countryCode.toLowerCase()}`
                    )}
                  />
                  <span className="truncate">{ch.displayName}</span>
                </button>
                {/* Go to chapter action — shown when this chapter is selected */}
                <AnimatePresence>
                  {selectedIndex === i && (
                    <motion.button
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => handleGoToChapter(i)}
                      className="ml-8 flex items-center gap-1.5 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium text-vault-gold transition-colors hover:bg-vault-gold/10"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Go to chapter
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Globe */}
          <div className="flex flex-col items-center gap-2">
            {/* Loading spinner — shown until map tiles are ready */}
            {!mapReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-vault-gold" />
              </div>
            )}
            <div
              className={cn(
                "h-[min(70vw,70vh)] w-[min(70vw,70vh)] overflow-hidden rounded-full ring-1 ring-white/10 md:h-[min(60vw,70vh)] md:w-[min(60vw,70vh)]",
                mapReady ? "opacity-100" : "opacity-0"
              )}
            >
              <Map
                mapStyle={style}
                style={{ width: "100%", height: "100%" }}
                initialViewState={{
                  longitude: activeChapter?.location.lon ?? 0,
                  latitude: activeChapter?.location.lat ?? 20,
                  zoom: 3.5,
                }}
                attributionControl={false}
                onLoad={handleLoad}
              >
              {chapters.map((ch, i) => {
                const isHighlighted = i === highlightedIndex
                const isSelected = selectedIndex === i
                return (
                  <Marker
                    key={ch.id}
                    longitude={ch.location.lon}
                    latitude={ch.location.lat}
                    anchor="bottom"
                    style={{ zIndex: isSelected ? 50 : isHighlighted ? 10 : 1 }}
                  >
                    <button
                      onClick={() => handlePinClick(i)}
                      className="group/marker cursor-pointer"
                      aria-label={`Select ${ch.displayName}`}
                    >
                      {/* Teardrop pin */}
                      {isHighlighted ? (
                        <svg
                          width={28}
                          height={36}
                          viewBox="0 0 28 36"
                          fill="none"
                          className="transition-transform duration-300"
                        >
                          <path
                            d="M14 1C7.373 1 2 6.373 2 13c0 8 12 20 12 20s12-12 12-20C26 6.373 20.627 1 14 1z"
                            fill="hsl(32, 70%, 55%)"
                          />
                          <circle cx="14" cy="12" r="4.5" fill="white" />
                        </svg>
                      ) : (
                        <svg
                          width={18}
                          height={24}
                          viewBox="0 0 18 24"
                          fill="none"
                          className="transition-transform duration-300 group-hover/marker:scale-110"
                        >
                          <path
                            d="M9 1C4.582 1 1 4.582 1 9c0 6 8 14 8 14s8-8 8-14C17 4.582 13.418 1 9 1z"
                            fill="hsl(32, 70%, 55%)"
                          />
                          <circle cx="9" cy="8.5" r="3" fill="white" />
                        </svg>
                      )}
                    </button>

                    {/* Popover — shown when this pin is selected */}
                    {isSelected && (
                      <div className="absolute left-1/2 bottom-full mb-1 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-2.5 rounded-lg bg-[hsl(30,10%,12%)] px-3 py-2 shadow-lg whitespace-nowrap">
                          <span className="text-xs font-medium text-white">
                            {ch.displayName}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGoToChapter(i)
                            }}
                            className="flex items-center gap-1 rounded-md bg-vault-gold px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-vault-gold/80"
                            aria-label={`Go to ${ch.displayName}`}
                          >
                            Go
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        {/* Arrow pointing down to pin */}
                        <div className="flex justify-center">
                          <div className="h-0 w-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[hsl(30,10%,12%)]" />
                        </div>
                      </div>
                    )}
                  </Marker>
                )
              })}
              </Map>
            </div>
            <p className="text-[9px] text-white/30">
              © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="hover:text-white/50">OpenStreetMap</a>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
