import { Unzip, UnzipInflate } from "fflate"

import { ImportError } from "@/types/import"

export type ZipEntries = Record<string, Uint8Array>

// Read in 16MB slices — never loads the full file into memory at once.
// This also works around a fflate 0.8.2 bug where unzipSync uses a 32-bit
// read for the ZIP64 central-directory offset, overflowing on files > 4 GB.
const CHUNK_SIZE = 16 * 1024 * 1024

export async function extractZip(file: File): Promise<ZipEntries> {
  return new Promise((resolve, reject) => {
    const entries: ZipEntries = {}

    const uz = new Unzip()
    uz.register(UnzipInflate)

    uz.onfile = (f) => {
      if (f.name.endsWith("/")) return // skip directory entries

      const chunks: Uint8Array[] = []

      f.ondata = (err, data, final) => {
        if (err) {
          reject(new ImportError("INVALID_ZIP", `Failed to decompress ${f.name}: ${err.message}`))
          return
        }
        if (data.length > 0) chunks.push(new Uint8Array(data))
        if (final) {
          const total = chunks.reduce((sum, c) => sum + c.length, 0)
          const merged = new Uint8Array(total)
          let offset = 0
          for (const c of chunks) {
            merged.set(c, offset)
            offset += c.length
          }
          entries[f.name] = merged
        }
      }

      f.start()
    }

    void (async () => {
      try {
        let offset = 0
        while (offset < file.size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE)
          const buffer = await slice.arrayBuffer()
          const chunk = new Uint8Array(buffer)
          offset += chunk.length
          uz.push(chunk, offset >= file.size)
        }
        resolve(entries)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        reject(new ImportError("INVALID_ZIP", `Failed to extract ZIP: ${message}`))
      }
    })()
  })
}
