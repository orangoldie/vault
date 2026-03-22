/**
 * Copies the MapLibre CSP worker to public/export/ for the export assembler.
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(
  __dirname,
  "../node_modules/maplibre-gl/dist/maplibre-gl-csp-worker.js"
)
const DEST_DIR = path.resolve(__dirname, "../public/export")
const DEST = path.join(DEST_DIR, "maplibre-worker.js")

fs.mkdirSync(DEST_DIR, { recursive: true })
fs.copyFileSync(SRC, DEST)

const size = (fs.statSync(DEST).size / 1024).toFixed(0)
console.log(`MapLibre worker copied (${size} KB)`)
