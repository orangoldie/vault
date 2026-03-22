import { namedFlavor } from "@protomaps/basemaps"

/**
 * Custom "vault" color theme for the globe map.
 * Warm beige landmasses, muted slate oceans, parchment feel.
 *
 * Single source of truth — used by both the app's globe and the export viewer.
 */
export function vaultMapTheme() {
  const base = namedFlavor("light")
  return {
    ...base,
    // Core surfaces
    background: "#d5cfc5",
    earth: "#e8e1d4",
    water: "#a8bcc8",

    // Natural areas — warmed
    park_a: "#d4dbc8",
    park_b: "#b8ceab",
    wood_a: "#cdd8c4",
    wood_b: "#b0c9a0",
    scrub_a: "#d2d9c8",
    scrub_b: "#b5cda8",
    glacier: "#e4e2dc",
    sand: "#ddd8c8",
    beach: "#e0dac4",

    // Built environment — warm greys
    buildings: "#c8c3b8",
    pedestrian: "#ddd8cc",
    industrial: "#cdd0c8",
    hospital: "#ddd5d0",
    school: "#ddd8cc",

    // Roads — subtle warm tones
    minor_a: "#e0dbd0",
    minor_b: "#ede8dc",
    link: "#ede8dc",
    major: "#ede8dc",
    highway: "#ede8dc",
    other: "#e0dbd0",
    minor_service: "#e0dbd0",

    // Road casings
    minor_service_casing: "#d0cbc0",
    minor_casing: "#d0cbc0",
    link_casing: "#d0cbc0",
    major_casing_late: "#d0cbc0",
    major_casing_early: "#d0cbc0",
    highway_casing_late: "#d0cbc0",
    highway_casing_early: "#d0cbc0",

    // Labels — muted warm
    roads_label_minor: "#8a8078",
    roads_label_minor_halo: "#e8e1d4",
    roads_label_major: "#8a8078",
    roads_label_major_halo: "#e8e1d4",
    ocean_label: "#7a8fa0",
    subplace_label: "#8a8580",
    subplace_label_halo: "#ddd8cc",
    city_label: "#5c5550",
    city_label_halo: "#ddd8cc",
    state_label: "#a8a098",
    state_label_halo: "#ddd8cc",
    country_label: "#989088",
    address_label: "#8a8078",
    address_label_halo: "#e8e1d4",

    // Boundaries
    boundaries: "#a8a098",

    // Landcover — warm shifted
    landcover: {
      grassland: "rgba(210, 220, 190, 1)",
      barren: "rgba(230, 220, 195, 1)",
      urban_area: "rgba(218, 212, 202, 1)",
      farmland: "rgba(212, 220, 192, 1)",
      glacier: "rgba(240, 238, 232, 1)",
      scrub: "rgba(218, 220, 195, 1)",
      forest: "rgba(195, 215, 190, 1)",
    },
  }
}
