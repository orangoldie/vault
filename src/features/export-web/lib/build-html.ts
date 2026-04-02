import type { Trip, Chapter, Photo } from "@/types/trip"

interface BuildHtmlOptions {
  trip: Trip
  chapters: Chapter[]
  photos: Photo[]
  /** Cover photo relative path (e.g. "photos/cover/filename.jpg") or null */
  coverPhotoPath: string | null
}

/**
 * Generates the index.html string for the exported trip.
 * All trip data is embedded inline — no fetch required.
 */
export function buildHtml({ trip, chapters, photos, coverPhotoPath }: BuildHtmlOptions): string {
  // Escape `<` as `\u003c` to prevent `</script>` in user data from
  // prematurely closing the script block when embedded in HTML.
  const vaultData = JSON.stringify({
    trip: { ...trip, exportCoverPhotoPath: coverPhotoPath },
    chapters,
    photos: photos.map((p) => ({
      ...p,
      exportPath: `./photos/${p.chapterId}/${p.filename}`,
    })),
  }).replace(/</g, "\\u003c")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="vault-export-version" content="1">
  <title>${escapeHtml(trip.name)} — Journey Vault</title>

  <!-- App display fonts (self-hosted WOFF2, all subsets) -->
  <link rel="stylesheet" href="./fonts/cormorant.css">
  <link rel="stylesheet" href="./fonts/outfit.css">
  <style>
    :root {
      --font-display: 'Cormorant', serif;
      --font-body: 'Outfit', sans-serif;
    }
  </style>

  <!-- Viewer styles -->
  <link rel="stylesheet" href="./assets/viewer.css">
</head>
<body class="font-sans antialiased">
  <div id="vault-root"></div>
  <noscript>This trip viewer requires JavaScript to display your travel memories.</noscript>

  <!-- Trip data — embedded, no fetch required -->
  <script>
    window.__VAULT_DATA__ = ${vaultData};
    window.__VAULT_ASSETS__ = {};
  </script>

  <!-- Map assets — loaded via script tags (works from file://) -->
  <script src="./assets/globe-data.js"></script>
  <script src="./assets/map-fonts.js"></script>
  <script src="./assets/map-sprites.js"></script>

  <!-- MapLibre worker source (viewer reads this and creates blob URL) -->
  <script src="./assets/maplibre-worker.js"></script>

  <!-- Viewer app — boots after all data is available -->
  <script src="./assets/viewer.js"></script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
