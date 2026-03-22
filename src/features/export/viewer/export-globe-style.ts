import { layers } from "@protomaps/basemaps"
import type { StyleSpecification } from "maplibre-gl"

import { vaultMapTheme } from "@/features/trip-detail/lib/vault-map-theme"

/**
 * Creates a MapLibre style spec for the export viewer's globe.
 * Uses custom protocol URLs that serve from the in-memory asset registry.
 */
export function createExportGlobeStyle(pmtilesUrl: string): StyleSpecification {
  const theme = vaultMapTheme()

  return {
    version: 8,
    projection: { type: "globe" },
    glyphs: "vault-fonts://{fontstack}/{range}.pbf",
    sprite: "vault-sprites://light",
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${pmtilesUrl}`,
        attribution:
          '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: layers("protomaps", theme, { lang: "en" }),
  } as StyleSpecification
}
