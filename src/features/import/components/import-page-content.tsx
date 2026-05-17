"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/features/landing/components/site-header"
import { SiteFooter } from "@/features/landing/components/site-footer"
import { ExportInstructions } from "./export-instructions"
import { ArchiveSection } from "./archive-section"
import { ImportProgress } from "./import-progress"
import { ImportErrorView } from "./import-error"
import { ExtractionSpinner } from "./extraction-spinner"
import { TripSelectionList } from "./trip-selection-list"
import { FeedbackButton } from "@/features/feedback/components/feedback-button"
import { importTrip, shouldWarnAboutSize, scanTripsFromFile } from "../lib/import-trip"
import { getAllTrips } from "@/stores/db"
import {
  ImportError,
  type ImportState,
  type ImportProgress as ImportProgressData,
  type TripSummary,
} from "@/types/import"
import type { Trip } from "@/types/trip"

const stateVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}
const stateTransition = { duration: 0.25, ease: [0.45, 0, 0.55, 1] as const }

const reducedStateVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
}


export function ImportPageContent() {
  const [importState, setImportState] = useState<ImportState>({ status: "idle" })
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripName, setTripName] = useState<string | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const importStartTime = useRef<number>(0)
  const activeRegionRef = useRef<HTMLDivElement>(null)
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

  // Focus the active region when transitioning away from idle for screen readers
  useEffect(() => {
    if (importState.status !== "idle") {
      activeRegionRef.current?.focus()
    }
  }, [importState.status])

  const startImport = useCallback(async (file: File, tripDirPath: string) => {
    setTripName(null)
    importStartTime.current = Date.now()

    setImportState({
      status: "importing",
      progress: { phase: "extracting", percent: 0, detail: "Extracting ZIP..." },
    })

    try {
      const result = await importTrip(file, {
        tripDirPath,
        onProgress: (progress: ImportProgressData) => {
          setImportState({ status: "importing", progress })
        },
      })

      setTripName(result.tripName)

      const elapsed = Date.now() - importStartTime.current
      if (elapsed >= 1000) {
        setImportState({
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
      setImportState({ status: "error", error: importError })
    }
  }, [router])

  // Scan phase — depends on the file object directly to avoid a stale closure
  const scanningFile = importState.status === "scanning" ? importState.file : null
  useEffect(() => {
    if (!scanningFile) return
    const file = scanningFile  // narrowed: File (not null) for the async closure below

    let cancelled = false

    async function runScan() {
      try {
        const scanStart = Date.now()
        const tripSummaries = await scanTripsFromFile(file)

        const elapsed = Date.now() - scanStart
        if (elapsed < 400) {
          await new Promise((r) => setTimeout(r, 400 - elapsed))
        }

        if (cancelled) return

        if (tripSummaries.length === 0) {
          setImportState({
            status: "error",
            error: new ImportError("MISSING_TRIP_JSON", "No trip.json found in ZIP"),
          })
        } else if (tripSummaries.length === 1) {
          startImport(file, tripSummaries[0].tripDirPath)
        } else {
          setImportState({ status: "selecting", file, trips: tripSummaries })
        }
      } catch (err) {
        if (cancelled) return
        const importError =
          err instanceof ImportError
            ? err
            : new ImportError("UNKNOWN", "An unexpected error occurred")
        setImportState({ status: "error", error: importError })
      }
    }

    runScan()
    return () => {
      cancelled = true
    }
  }, [scanningFile, startImport])

  function handleFileSelected(file: File) {
    const sizeMb = shouldWarnAboutSize(file)
    if (sizeMb !== null) {
      setImportState({ status: "confirm-large-file", file, sizeMb })
      return
    }
    setImportState({ status: "scanning", file })
  }

  function handleTripSelected(trip: TripSummary) {
    if (importState.status !== "selecting") return
    startImport(importState.file, trip.tripDirPath)
  }

  function handleRetry() {
    setImportState({ status: "idle" })
  }

  function handleConfirmLargeFile() {
    if (importState.status === "confirm-large-file") {
      setImportState({ status: "scanning", file: importState.file })
    }
  }

  function handleDismissSelection() {
    setImportState({ status: "idle" })
  }

  const variants = prefersReducedMotion ? reducedStateVariants : stateVariants
  const transition = prefersReducedMotion ? { duration: 0 } : stateTransition

  const isIdle = importState.status === "idle"

  return (
    <div className="flex min-h-svh flex-col bg-vault-bg">
      <SiteHeader visible={true} />

      <main id="main-content" className="flex-1">
        {/* Page intro */}
        <div className="max-w-3xl mx-auto px-6 pb-10 pt-20 sm:px-8">
          <h1 className="font-serif text-3xl font-semibold tracking-wide text-vault-text md:text-4xl">
            Import your Polarsteps trips
          </h1>
        </div>

        {/* Archive section — only when trips exist */}
        {trips.length > 0 && <ArchiveSection trips={trips} />}

        {/* Import section */}
        <div className="max-w-3xl mx-auto px-6 pb-12 sm:px-8">
          {trips.length > 0 && (
            <div className="mb-5 border-t border-vault-gold/15 pt-8">
              <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-vault-gold/70">
                Add another trip
              </h2>
            </div>
          )}

          {/* Live region — announces import state changes to screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {importState.status === "scanning" && "Scanning your file…"}
            {importState.status === "confirm-large-file" && "Large file detected. Confirmation required."}
            {importState.status === "selecting" && "Multiple trips found. Select a trip to import."}
            {importState.status === "importing" && "Importing your trip…"}
            {importState.status === "error" && "Import failed."}
          </div>

          {/* Focus target — receives focus when transitioning away from idle */}
          <div
            ref={activeRegionRef}
            tabIndex={-1}
            className="outline-none"
          >
            <AnimatePresence mode="wait">
              {isIdle && (
                <motion.div
                  key="idle"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                >
                  <ExportInstructions onFileSelected={handleFileSelected} />
                </motion.div>
              )}

              {importState.status === "confirm-large-file" && (
                <motion.div
                  key="confirm"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                >
                  <div className="flex flex-col gap-5 rounded-2xl border border-vault-gold/20 bg-vault-gold/[0.03] p-6 md:p-8">
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-vault-text">
                        Large file detected
                      </h2>
                      <p className="mt-2 text-sm text-vault-text-dim">
                        This file is {importState.sizeMb} MB. Importing may take a
                        while and use significant browser storage. Continue?
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleRetry}
                        className="h-10 px-5"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmLargeFile}
                        className="h-10 px-5"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {importState.status === "scanning" && (
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

              {importState.status === "selecting" && (
                <motion.div
                  key="selecting"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                >
                  <TripSelectionList
                    trips={importState.trips}
                    onSelectTrip={handleTripSelected}
                    onDismiss={handleDismissSelection}
                  />
                </motion.div>
              )}

              {importState.status === "importing" && (
                <motion.div
                  key="importing"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                >
                  <ImportProgress
                    tripName={tripName}
                    progress={importState.progress}
                  />
                </motion.div>
              )}

              {importState.status === "error" && (
                <motion.div
                  key="error"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                >
                  <ImportErrorView
                    code={importState.error.code}
                    onRetry={handleRetry}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      <SiteFooter disclaimer />
      <FeedbackButton />
    </div>
  )
}
