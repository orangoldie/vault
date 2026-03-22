/**
 * Utilities for encoding binary assets into JavaScript files
 * that register data into window.__VAULT_ASSETS__.
 */

/** Encode a string to UTF-8 Uint8Array */
export function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/** Convert ArrayBuffer to base64 string */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  // Process in chunks to avoid call stack size exceeded
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

/** Build a JS script string that registers a single asset into the global registry */
export function buildAssetScript(key: string, base64: string): string {
  return `window.__VAULT_ASSETS__["${key}"] = "${base64}";\n`
}

/** Build a JS script string for all font PBF files */
export function buildFontScript(
  fonts: Map<string, ArrayBuffer>
): string {
  const lines: string[] = []
  for (const [path, data] of fonts) {
    // path like "map-assets/fonts/Noto Sans Regular/0-255.pbf"
    // key like "font:Noto Sans Regular/0-255.pbf"
    const key = "font:" + path.replace("map-assets/fonts/", "")
    lines.push(
      `window.__VAULT_ASSETS__["${key}"] = "${arrayBufferToBase64(data)}";`
    )
  }
  return lines.join("\n") + "\n"
}

/** Build a JS script string for sprite files */
export function buildSpriteScript(
  sprites: Map<string, ArrayBuffer>
): string {
  const lines: string[] = []
  for (const [path, data] of sprites) {
    // path like "map-assets/sprites/light.json"
    // key like "sprite:light.json"
    const key = "sprite:" + path.replace("map-assets/sprites/", "")
    lines.push(
      `window.__VAULT_ASSETS__["${key}"] = "${arrayBufferToBase64(data)}";`
    )
  }
  return lines.join("\n") + "\n"
}

/** Build a JS script that stores the MapLibre worker source as a raw string */
export function buildWorkerScript(workerSource: string): string {
  // Escape backticks and ${} in the worker source
  const escaped = workerSource
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
  return `window.__VAULT_ASSETS__["maplibre:worker"] = \`${escaped}\`;\n`
}
