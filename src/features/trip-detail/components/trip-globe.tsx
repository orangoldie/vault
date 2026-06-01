"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Globe as GlobeIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import maplibregl from "maplibre-gl"
import { Protocol } from "pmtiles"
import { Map, Marker, Source, Layer } from "@vis.gl/react-maplibre"
import "maplibre-gl/dist/maplibre-gl.css"

import type { Chapter } from "@/types/trip"
import { cn } from "@/lib/utils"

import { createGlobeStyle } from "../lib/globe-style"
import { GLOBE_FRAME_MAX, useGlobeFit } from "../lib/globe-fit"
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
  /** Override the default globe map style (used by the export viewer). */
  mapStyle?: maplibregl.StyleSpecification
}

// Internal layout always renders at full size; the wrapper is CSS-scaled to
// fit the available gutter (see useGlobeFit / globe-fit.ts).
const FRAME_SIZE = GLOBE_FRAME_MAX
const GLOBE_SIZE = 280
const GLOBE_OFFSET = (FRAME_SIZE - GLOBE_SIZE) / 2

export function TripGlobe({
  chapters,
  activeIndex,
  visible,
  onNavigate,
  mapStyle: mapStyleOverride,
}: TripGlobeProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const userDragged = useRef(false)
  const [expanded, setExpanded] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const fit = useGlobeFit()

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

  const style = useMemo(
    () => mapStyleOverride ?? createGlobeStyle("vault"),
    [mapStyleOverride]
  )

  const routeGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: chapters.map((ch) => [ch.location.lon, ch.location.lat]),
          },
        },
      ],
    }),
    [chapters]
  )

  // Fly to active chapter
  useEffect(() => {
    if (!mapReady || !mapRef.current || chapters.length === 0) return
    const chapter = chapters[activeIndex]
    if (!chapter) return

    userDragged.current = false
    mapRef.current.flyTo({
      center: [chapter.location.lon, chapter.location.lat],
      zoom: 3.5,
      duration: prefersReducedMotion ? 0 : 1000,
    })
  }, [mapReady, activeIndex, chapters, prefersReducedMotion])

  // Track when user manually drags the globe
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    const onDragEnd = () => { userDragged.current = true }
    map.on("dragend", onDragEnd)
    return () => { map.off("dragend", onDragEnd) }
  }, [mapReady])

  // Snap back to active chapter on page scroll after user drag
  useEffect(() => {
    function handleScroll() {
      if (!userDragged.current || !mapRef.current || chapters.length === 0) return
      const chapter = chapters[activeIndex]
      if (!chapter) return

      userDragged.current = false
      mapRef.current.flyTo({
        center: [chapter.location.lon, chapter.location.lat],
        zoom: 3.5,
        duration: prefersReducedMotion ? 0 : 800,
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [activeIndex, chapters, prefersReducedMotion])

  // Pause/resume render loop based on visibility and whether the globe has room
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    if (visible && fit.show) {
      map.resize()
      map.triggerRepaint()
      // Re-center on the active chapter in case it changed while hidden
      const chapter = chapters[activeIndex]
      if (chapter) {
        map.flyTo({
          center: [chapter.location.lon, chapter.location.lat],
          zoom: 3.5,
          duration: prefersReducedMotion ? 0 : 600,
        })
      }
    } else {
      map.stop()
    }
  }, [mapReady, visible, fit.show, activeIndex, chapters, prefersReducedMotion])

  const handleLoad = useCallback((e: maplibregl.MapLibreEvent) => {
    const map = e.target
    mapRef.current = map
    // Cap device pixel ratio at 2 to save GPU
    map.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    setMapReady(true)
  }, [])

  const handleMarkerClick = useCallback(
    (index: number) => {
      const chapter = chapters[index]
      if (!chapter) return
      const section = document.querySelector(
        `[data-chapter-section][data-chapter-id="${chapter.id}"]`
      )
      if (!section) return
      const y =
        section.getBoundingClientRect().top +
        window.scrollY -
        window.innerHeight * 0.03
      window.scrollTo({ top: y, behavior: "smooth" })
    },
    [chapters]
  )

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleClose = useCallback(() => {
    setExpanded(false)
  }, [])

  const activeChapter = chapters[activeIndex]

  return (
    <>
      {/* Desktop mini globe — right edge, vertically centered. Always mounted
          (while it has room) to preserve map state. Sized to fit the gutter
          beside the content column via CSS scale; see globe-fit.ts. */}
      <div
        className={cn(
          "fixed top-1/2 z-30 transition-all",
          prefersReducedMotion ? "duration-0" : "duration-300"
        )}
        style={{
          right: "calc(1rem + var(--scrollbar-width, 0px))",
          display: fit.show ? "block" : "none",
          transformOrigin: "right center",
          transform: `translateY(-50%) scale(${(visible ? 1 : 0.8) * fit.scale})`,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div
          className="group relative"
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
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
              projection="globe"
              style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}
              initialViewState={{
                longitude: activeChapter?.location.lon ?? 0,
                latitude: activeChapter?.location.lat ?? 20,
                zoom: 3,
              }}
              attributionControl={false}
              onLoad={handleLoad}
            >
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer
                  id="route-line"
                  type="line"
                  layout={{
                    "line-cap": "round",
                  }}
                  paint={{
                    "line-color": "hsl(32, 70%, 55%)",
                    "line-width": 2,
                    "line-opacity": 0.6,
                    "line-dasharray": [1.5, 2.5],
                  }}
                />
              </Source>
              {chapters.map((ch, i) => (
                <Marker
                  key={ch.id}
                  longitude={ch.location.lon}
                  latitude={ch.location.lat}
                >
                  <button
                    onClick={() => handleMarkerClick(i)}
                    aria-label={`Go to ${ch.displayName}`}
                    className={cn(
                      "cursor-pointer rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "h-3.5 w-3.5 shadow-[0_0_8px_hsl(32,70%,55%),0_0_18px_hsl(32,70%,55%)] animate-[pulse-glow_2s_ease-in-out_infinite]"
                        : "h-2 w-2 hover:h-3 hover:w-3"
                    )}
                    style={{
                      backgroundColor: "hsl(32, 70%, 55%)",
                    }}
                  />
                </Marker>
              ))}
            </Map>
          </div>

          {/* Expand button */}
          <button
            onClick={handleExpand}
            aria-label="View trip on globe"
            className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 cursor-pointer rounded-full bg-vault-surface/90 px-2.5 py-0.5 text-[10px] font-medium text-vault-text-dim shadow-sm backdrop-blur-sm transition-all hover:bg-vault-surface hover:text-vault-text opacity-0 group-hover:opacity-100"
          >
            Click to expand
          </button>

          {/* OSM attribution */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-vault-text-dim/50">
            © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="hover:text-vault-text-dim">OpenStreetMap</a>
          </div>
        </div>
      </div>

      {/* Mobile FAB — shown when the desktop globe has no room for itself */}
      <AnimatePresence>
        {visible && !fit.show && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            onClick={handleExpand}
            className={cn(
              "fixed bottom-20 z-30 flex h-11 w-11 items-center justify-center rounded-full shadow-lg",
              "bg-vault-surface text-vault-gold ring-1 ring-vault-gold/20",
              "transition-colors hover:bg-vault-gold hover:text-white"
            )}
            style={{ right: "calc(1rem + var(--scrollbar-width, 0px))" }}
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
          mapStyle={mapStyleOverride}
        />
      )}
    </>
  )
}
