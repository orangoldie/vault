# Git LFS — Map Asset Migration

## Decision

`public/textures/*.pmtiles`, `public/map-assets/sprites/*.png`, and `public/map-assets/fonts/**/*.pbf` were originally tracked by Git LFS. They were migrated to regular git storage for v1.

## Why

Vercel does not reliably fetch Git LFS objects during deployment — it clones the repo but often deploys the 133-byte LFS pointer file instead of the real binary. This caused MapLibre to throw "Wrong magic number for PMTiles archive" because it was reading the pointer text instead of the actual tile data.

## Why not external hosting (v1)

The offline export already embeds map data independently (base64 in `globe-data.js`). For v1 simplicity, self-hosting on Vercel is acceptable. The three asset groups total ~27MB, well within GitHub's per-file and repo limits.

## For v2

When traffic grows, move `globe.pmtiles` and map assets to Cloudflare R2 (zero egress fees, native range request support, officially recommended by Protomaps). Update the source URL in `src/features/trip-detail/lib/globe-style.ts`.

## Files removed from LFS

| File pattern | Size |
|---|---|
| `public/textures/*.pmtiles` | 15MB |
| `public/map-assets/fonts/**/*.pbf` | 12MB |
| `public/map-assets/sprites/*.png` | 56KB |
