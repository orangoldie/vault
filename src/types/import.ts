export type ImportErrorCode =
  | "INVALID_ZIP"
  | "MISSING_TRIP_JSON"
  | "MALFORMED_JSON"
  | "EMPTY_TRIP"
  | "QUOTA_EXCEEDED"
  | "FILE_TOO_LARGE"
  | "UNKNOWN"

export type ImportPhase = "extracting" | "reading" | "storing"

export interface ImportProgress {
  phase: ImportPhase
  percent: number
  detail: string
}

export interface ImportResult {
  tripName: string
  slug: string
  chapterCount: number
  photoCount: number
  startDate: number
  endDate: number
  totalKm: number
}

/** Metadata-only representation returned by scanTrips(). No photos, no full chapter data. */
export interface ScannedTrip {
  id: number
  name: string
  startDate: number
  endDate: number
  chapterCount: number
  tripDirPath: string
}

/** ScannedTrip enriched with vault context. Returned by scanTripsFromFile(). */
export interface TripSummary extends ScannedTrip {
  alreadyImported: boolean
}

export class ImportError extends Error {
  code: ImportErrorCode

  constructor(code: ImportErrorCode, message: string) {
    super(message)
    this.name = "ImportError"
    this.code = code
  }
}

export type ImportState =
  | { status: "idle" }
  | { status: "confirm-large-file"; file: File; sizeMb: number }
  | { status: "scanning"; file: File }
  | { status: "selecting"; file: File; trips: TripSummary[] }
  | { status: "importing"; progress: ImportProgress }
  | { status: "error"; error: ImportError }
