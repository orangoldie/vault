"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { ImportPrompt } from "./import-prompt"
import { ImportProgress } from "./import-progress"
import { ImportSummary } from "./import-summary"
import { ImportErrorView } from "./import-error"
import { TripList } from "./trip-list"
import { importTrip, shouldWarnAboutSize } from "../lib/import-trip"
import { getAllTrips } from "@/stores/db"
import { ImportError, type ImportState, type ImportProgress as ImportProgressData } from "@/types/import"
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

  async function handleFileSelected(file: File) {
    // Check file size warning
    const sizeMb = shouldWarnAboutSize(file)
    if (sizeMb !== null) {
      setState({ status: "confirm-large-file", file, sizeMb })
      return
    }

    await startImport(file)
  }

  async function startImport(file: File) {
    setTripName(null)
    importStartTime.current = Date.now()

    setState({
      status: "importing",
      progress: { phase: "extracting", percent: 0, detail: "Extracting ZIP..." },
    })

    try {
      const result = await importTrip(file, {
        onProgress: (progress: ImportProgressData) => {
          setState({ status: "importing", progress })
        },
      })

      setTripName(result.tripName)

      const elapsed = Date.now() - importStartTime.current

      // If import was very fast (< 1 second), skip progress view
      if (elapsed < 1000) {
        setState({ status: "success", result })
      } else {
        // Brief hold at 100% before showing success
        setState({
          status: "importing",
          progress: { phase: "storing", percent: 100, detail: "Done" },
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
        setState({ status: "success", result })
      }

      await loadTrips()
    } catch (err) {
      const importError =
        err instanceof ImportError
          ? err
          : new ImportError("UNKNOWN", "An unexpected error occurred")

      setState({ status: "error", error: importError })
    }
  }

  function handleRetry() {
    setState({ status: "idle" })
  }

  function handleDone() {
    setState({ status: "idle" })
  }

  function handleImportAnother() {
    setState({ status: "idle" })
  }

  function handleConfirmLargeFile() {
    if (state.status === "confirm-large-file") {
      startImport(state.file)
    }
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
            <TripList trips={trips} onImport={handleRetry} />
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

        {state.status === "success" && (
          <motion.div
            key="success"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ImportSummary
              result={state.result}
              onImportAnother={handleImportAnother}
              onDone={handleDone}
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
