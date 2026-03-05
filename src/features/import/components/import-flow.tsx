"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { ImportPrompt } from "./import-prompt"
import { ImportProgress } from "./import-progress"
import { ImportErrorView } from "./import-error"
import { TripList } from "./trip-list"
import { ExtractionSpinner } from "./extraction-spinner"
import { TripSelectionList } from "./trip-selection-list"
import { importTrip, shouldWarnAboutSize, scanTripsFromFile } from "../lib/import-trip"
import { getAllTrips } from "@/stores/db"
import { ImportError, type ImportState, type ImportProgress as ImportProgressData, type TripSummary } from "@/types/import"
import type { Trip } from "@/types/trip"

const motionVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const motionTransition = { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const }

const reducedMotionVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
}

export function ImportFlow() {
  const [state, setState] = useState<ImportState>({ status: "idle" })
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripName, setTripName] = useState<string | null>(null)
  const headingRef = useRef<HTMLDivElement>(null)
  const importStartTime = useRef<number>(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const loadTrips = useCallback(async () => {
    try {
      const allTrips = await getAllTrips()
      setTrips(allTrips)
    } catch (err) {
      console.error("Failed to load trips from IndexedDB:", err)
    }
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  // Focus heading after state change for accessibility
  useEffect(() => {
    if (state.status !== "idle") {
      headingRef.current?.focus()
    }
  }, [state.status])

  // Scan phase: triggered when state becomes "scanning"
  useEffect(() => {
    if (state.status !== "scanning") return

    let cancelled = false
    const file = state.file

    async function runScan() {
      try {
        const scanStart = Date.now()
        const tripSummaries = await scanTripsFromFile(file)

        // Ensure spinner shows for at least 400ms to avoid a jarring flash
        const elapsed = Date.now() - scanStart
        if (elapsed < 400) {
          await new Promise((r) => setTimeout(r, 400 - elapsed))
        }

        if (cancelled) return

        if (tripSummaries.length === 0) {
          setState({
            status: "error",
            error: new ImportError("MISSING_TRIP_JSON", "No trip.json found in ZIP"),
          })
        } else if (tripSummaries.length === 1) {
          // Single trip: skip selection, import directly
          startImport(file, tripSummaries[0].tripDirPath)
        } else {
          setState({ status: "selecting", file, trips: tripSummaries })
        }
      } catch (err) {
        if (cancelled) return
        const importError =
          err instanceof ImportError
            ? err
            : new ImportError("UNKNOWN", "An unexpected error occurred")
        setState({ status: "error", error: importError })
      }
    }

    runScan()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  async function handleFileSelected(file: File) {
    // Check file size warning
    const sizeMb = shouldWarnAboutSize(file)
    if (sizeMb !== null) {
      setState({ status: "confirm-large-file", file, sizeMb })
      return
    }

    setState({ status: "scanning", file })
  }

  async function startImport(file: File, tripDirPath: string) {
    setTripName(null)
    importStartTime.current = Date.now()

    setState({
      status: "importing",
      progress: { phase: "extracting", percent: 0, detail: "Extracting ZIP..." },
    })

    try {
      const result = await importTrip(file, {
        tripDirPath,
        onProgress: (progress: ImportProgressData) => {
          setState({ status: "importing", progress })
        },
      })

      setTripName(result.tripName)

      const elapsed = Date.now() - importStartTime.current

      // Brief hold at 100% before navigating so the user sees completion
      if (elapsed >= 1000) {
        setState({
          status: "importing",
          progress: { phase: "storing", percent: 100, detail: "Done" },
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      router.push(`/trip/${result.slug}`)
    } catch (err) {
      const importError =
        err instanceof ImportError
          ? err
          : new ImportError("UNKNOWN", "An unexpected error occurred")

      setState({ status: "error", error: importError })
    }
  }

  function handleTripSelected(trip: TripSummary) {
    if (state.status !== "selecting") return
    startImport(state.file, trip.tripDirPath)
  }

  function handleRetry() {
    setState({ status: "idle" })
  }

  function handleConfirmLargeFile() {
    if (state.status === "confirm-large-file") {
      setState({ status: "scanning", file: state.file })
    }
  }

  function handleDismissSelection() {
    setState({ status: "idle" })
  }

  const variants = prefersReducedMotion ? reducedMotionVariants : motionVariants
  const transition = prefersReducedMotion ? { duration: 0 } : motionTransition

  return (
    <div
      ref={headingRef}
      tabIndex={-1}
      className="outline-none"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {state.status === "idle" && trips.length === 0 && (
          <motion.div
            key="prompt"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ImportPrompt onFileSelected={handleFileSelected} />
          </motion.div>
        )}

        {state.status === "idle" && trips.length > 0 && (
          <motion.div
            key="trip-list"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <TripList trips={trips} onFileSelected={handleFileSelected} />
          </motion.div>
        )}

        {state.status === "confirm-large-file" && (
          <motion.div
            key="confirm"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-[1.125rem] font-medium text-primary">
                Large file detected
              </h2>
              <p className="text-base text-muted-foreground">
                This file is {state.sizeMb} MB. Importing may take a while and
                use significant storage. Continue?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="h-11 px-6">
                  Cancel
                </Button>
                <Button onClick={handleConfirmLargeFile} className="h-11 px-6">
                  Continue Import
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {state.status === "scanning" && (
          <motion.div
            key="scanning"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ExtractionSpinner />
          </motion.div>
        )}

        {state.status === "selecting" && (
          <motion.div
            key="selecting"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <TripSelectionList
              trips={state.trips}
              onSelectTrip={handleTripSelected}
              onDismiss={handleDismissSelection}
            />
          </motion.div>
        )}

        {state.status === "importing" && (
          <motion.div
            key="progress"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ImportProgress
              tripName={tripName}
              progress={state.progress}
            />
          </motion.div>
        )}

        {state.status === "error" && (
          <motion.div
            key="error"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ImportErrorView
              code={state.error.code}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
