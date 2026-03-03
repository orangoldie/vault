import { unzipSync } from "fflate"

import { ImportError } from "@/types/import"

export type ZipEntries = Record<string, Uint8Array>

export async function extractZip(file: File): Promise<ZipEntries> {
  try {
    const buffer = await file.arrayBuffer()
    const data = new Uint8Array(buffer)
    const entries = unzipSync(data)
    return entries
  } catch (err) {
    if (err instanceof ImportError) throw err
    const message = err instanceof Error ? err.message : "Unknown error"
    throw new ImportError("INVALID_ZIP", `Failed to extract ZIP: ${message}`)
  }
}
