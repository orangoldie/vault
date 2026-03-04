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
  chapterCount: number
  photoCount: number
  startDate: number
  endDate: number
  totalKm: number
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
  | { status: "importing"; progress: ImportProgress }
  | { status: "success"; result: ImportResult }
  | { status: "error"; error: ImportError }
