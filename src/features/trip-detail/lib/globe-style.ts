import { layers, namedFlavor } from "@protomaps/basemaps"
import type { StyleSpecification } from "maplibre-gl"

import { vaultMapTheme } from "./vault-map-theme"

const ORIGIN =
  typeof window !== "undefined" ? window.location.origin : ""

const PMTILES_URL = ORIGIN
  ? `pmtiles://${ORIGIN}/textures/globe.pmtiles`
  : ""

/**
 * Creates a MapLibre style spec for the globe using bundled PMTiles
 * and Protomaps basemap layers.
 */
export function createGlobeStyle(
  flavor: "vault" | string = "vault"
): StyleSpecification {
  const theme = flavor === "vault" ? vaultMapTheme() : namedFlavor(flavor)
  // Sprites: use light sprites for vault (same icon set), otherwise match flavor
  const spriteName = flavor === "vault" ? "light" : flavor

  return {
    version: 8,
    projection: { type: "globe" },
    glyphs: `${ORIGIN}/map-assets/fonts/{fontstack}/{range}.pbf`,
    sprite: `${ORIGIN}/map-assets/sprites/${spriteName}`,
    sources: {
      protomaps: {
        type: "vector",
        url: PMTILES_URL,
        attribution:
          '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: layers("protomaps", theme, { lang: "en" }),
  } as StyleSpecification
}
