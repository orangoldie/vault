"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Globe as GlobeIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import maplibregl from "maplibre-gl"
import { Protocol } from "pmtiles"
import { Map, Marker } from "@vis.gl/react-maplibre"
import "maplibre-gl/dist/maplibre-gl.css"

import type { Chapter } from "@/types/trip"
import { cn } from "@/lib/utils"

import { createGlobeStyle } from "../lib/globe-style"
import { CompassRose } from "./compass-rose"
import { GlobeOverlay } from "./globe-overlay"

// Register PMTiles protocol once
let protocolRegistered = false
function ensureProtocol() {
  if (protocolRegistered) return
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)
  protocolRegistered = true
}

interface TripGlobeProps {
  chapters: Chapter[]
  activeIndex: number
  visible: boolean
  onNavigate: (index: number) => void
}

const GLOBE_SIZE = 180
const FRAME_SIZE = 220
const GLOBE_OFFSET = (FRAME_SIZE - GLOBE_SIZE) / 2

export function TripGlobe({
  chapters,
  activeIndex,
  visible,
  onNavigate,
}: TripGlobeProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    ensureProtocol()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const style = useMemo(() => createGlobeStyle("vault"), [])

  // Fly to active chapter
  useEffect(() => {
    if (!mapReady || !mapRef.current || chapters.length === 0) return
    const chapter = chapters[activeIndex]
    if (!chapter) return

    mapRef.current.flyTo({
      center: [chapter.location.lon, chapter.location.lat],
      zoom: 3,
      duration: prefersReducedMotion ? 0 : 800,
    })
  }, [mapReady, activeIndex, chapters, prefersReducedMotion])

  // Pause/resume render loop based on visibility
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    if (visible) {
      map.resize()
      map.triggerRepaint()
    } else {
      map.stop()
    }
  }, [mapReady, visible])

  const handleLoad = useCallback((e: maplibregl.MapLibreEvent) => {
    const map = e.target
    mapRef.current = map
    // Cap device pixel ratio at 2 to save GPU
    map.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // Disable interactions on the mini globe
    map.dragRotate.disable()
    map.scrollZoom.disable()
    map.touchZoomRotate.disable()
    map.doubleClickZoom.disable()
    map.dragPan.disable()
    setMapReady(true)
  }, [])

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleClose = useCallback(() => {
    setExpanded(false)
  }, [])

  const activeChapter = chapters[activeIndex]

  return (
    <>
      {/* Desktop mini globe — bottom-right corner */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="fixed bottom-6 right-6 z-30 hidden md:block"
          >
            <div
              className="group relative cursor-pointer"
              style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
              onClick={handleExpand}
              role="button"
              tabIndex={0}
              aria-label="View trip on globe"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleExpand()
                }
              }}
            >
              {/* Compass rose frame */}
              <CompassRose
                size={FRAME_SIZE}
                className="absolute inset-0 transition-opacity group-hover:opacity-100"
              />

              {/* Globe canvas */}
              <div
                className="absolute overflow-hidden rounded-full"
                style={{
                  top: GLOBE_OFFSET,
                  left: GLOBE_OFFSET,
                  width: GLOBE_SIZE,
                  height: GLOBE_SIZE,
                }}
              >
                <Map
                  mapStyle={style}
                  style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}
                  initialViewState={{
                    longitude: activeChapter?.location.lon ?? 0,
                    latitude: activeChapter?.location.lat ?? 20,
                    zoom: 2.5,
                  }}
                  attributionControl={false}
                  onLoad={handleLoad}
                  interactive={false}
                >
                  {chapters.map((ch, i) => (
                    <Marker
                      key={ch.id}
                      longitude={ch.location.lon}
                      latitude={ch.location.lat}
                    >
                      <div
                        className={cn(
                          "rounded-full transition-all duration-300",
                          i === activeIndex
                            ? "h-2.5 w-2.5 shadow-[0_0_6px_hsl(32,70%,55%),0_0_14px_hsl(32,70%,55%)] animate-[pulse-glow_2s_ease-in-out_infinite]"
                            : "h-1.5 w-1.5"
                        )}
                        style={{
                          backgroundColor: "hsl(32, 70%, 55%)",
                        }}
                      />
                    </Marker>
                  ))}
                </Map>
              </div>

              {/* Hover expand hint */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-vault-surface/90 px-2.5 py-0.5 text-[10px] font-medium text-vault-text-dim opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                Click to expand
              </div>

              {/* OSM attribution */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-vault-text-dim/50">
                © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="hover:text-vault-text-dim">OpenStreetMap</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile FAB — visible on small screens */}
      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            onClick={handleExpand}
            className={cn(
              "fixed bottom-20 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full shadow-lg md:hidden",
              "bg-vault-surface text-vault-gold ring-1 ring-vault-gold/20",
              "transition-colors hover:bg-vault-gold hover:text-white"
            )}
            aria-label="View trip on globe"
          >
            <GlobeIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded overlay */}
      {expanded && (
        <GlobeOverlay
          chapters={chapters}
          activeIndex={activeIndex}
          onNavigate={onNavigate}
          onClose={handleClose}
        />
      )}
    </>
  )
}
