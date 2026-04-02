import { addProtocol, setWorkerUrl } from "maplibre-gl"
import { Protocol } from "pmtiles"

/**
 * Decode a base64 string to ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Register custom MapLibre protocols that serve map data from the
 * in-memory asset registry (window.__VAULT_ASSETS__).
 *
 * This enables the interactive globe to work from file:// without
 * any network requests.
 *
 * Returns the PMTiles blob URL so callers can pass it to createExportGlobeStyle.
 */
export function registerVaultProtocols(
  assets: Record<string, string>
): string | null {
  let pmtilesBlobUrl: string | null = null

  // Decode all base64 assets to ArrayBuffer
  const decoded = new Map<string, ArrayBuffer>()
  for (const [key, value] of Object.entries(assets)) {
    if (key === "maplibre:worker") continue
    decoded.set(key, base64ToArrayBuffer(value))
  }

  // PMTiles protocol — serve tile requests from in-memory ArrayBuffer
  const pmtilesBuffer = decoded.get("pmtiles:globe")
  if (pmtilesBuffer) {
    const protocol = new Protocol()
    addProtocol("pmtiles", protocol.tile)

    // Create a blob URL for the PMTiles data so MapLibre can load it
    const blob = new Blob([pmtilesBuffer], {
      type: "application/x-protobuf",
    })
    const blobUrl = URL.createObjectURL(blob)
    pmtilesBlobUrl = blobUrl
  }

  // Font protocol — intercepts glyph requests (MapLibre v5 Promise-based API)
  addProtocol("vault-fonts", async (params) => {
    const key = params.url.replace("vault-fonts://", "font:")
    const data = decoded.get(key)
    if (!data) throw new Error(`Missing font asset: ${key}`)
    return { data }
  })

  // Sprite protocol — serve sprite JSON and PNG from memory
  addProtocol("vault-sprites", async (params) => {
    const key = params.url.replace("vault-sprites://", "sprite:")
    const data = decoded.get(key)
    if (!data) throw new Error(`Missing sprite asset: ${key}`)
    return { data }
  })

  // Worker — create blob URL from inlined source
  const workerSource = assets["maplibre:worker"]
  if (workerSource) {
    const workerBlob = new Blob([workerSource], { type: "text/javascript" })
    setWorkerUrl(URL.createObjectURL(workerBlob))
  }

  return pmtilesBlobUrl
}
