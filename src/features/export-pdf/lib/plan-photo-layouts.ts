import justifiedLayout from "better-justified-layout"

import type { Chapter } from "@/types/trip"
import type { ClassifiedPhoto } from "./classify-photos"
import { pdfTheme, contentWidth, fullPageHeight, titleMetaHeight, descriptionMarginTop } from "./pdf-theme"
import { type FontMetrics, measureParagraphLineCount, twoColumnCapacity } from "./measure-text"

const t = pdfTheme

// ── Text height measurement ─────────────────────────────────

export interface ChapterTextMetrics {
  headerHeight: number
  useTwoColumns: boolean
  hasTextContinuation: boolean
  lastContinuationHeight: number
}

export function measureChapterText(
  chapter: Chapter,
  fontMetrics: FontMetrics,
): ChapterTextMetrics {
  const description = chapter.description ?? ""
  const wordCount = description ? description.split(/\s+/).length : 0
  const useTwoColumns = wordCount > t.text.twoColumnThreshold

  let descHeight = 0
  let hasTextContinuation = false
  let lastContinuationHeight = 0

  if (description) {
    const columnWidth = useTwoColumns
      ? (contentWidth - t.spacing.columnGap) / 2
      : Math.min(contentWidth, 380)
    const totalLines = measureParagraphLineCount(
      fontMetrics,
      description,
      t.sizes.body,
      columnWidth,
    )

    if (useTwoColumns) {
      const { maxLinesFirstPage, maxLinesFullPage, renderedLineHeight } = twoColumnCapacity(
        fullPageHeight,
        titleMetaHeight,
        descriptionMarginTop,
        t.sizes.body,
        t.lineHeights.body,
      )
      hasTextContinuation = totalLines > 2 * maxLinesFirstPage
      const effectiveLines = hasTextContinuation
        ? maxLinesFirstPage
        : Math.ceil(totalLines / 2)
      descHeight = effectiveLines * renderedLineHeight + descriptionMarginTop

      if (hasTextContinuation) {
        const remaining = totalLines - 2 * maxLinesFirstPage
        const contPages = Math.ceil(remaining / (2 * maxLinesFullPage))
        const linesOnLast = remaining - (contPages - 1) * 2 * maxLinesFullPage
        const col1Lines = Math.min(linesOnLast, maxLinesFullPage)
        lastContinuationHeight = col1Lines * renderedLineHeight
      }
    } else {
      const renderedLineHeight = t.sizes.body * t.lineHeights.body
      descHeight = totalLines * renderedLineHeight + descriptionMarginTop
      const maxDescOnFirstPage = fullPageHeight - titleMetaHeight - t.spacing.textToPhotos
      hasTextContinuation = descHeight > maxDescOnFirstPage
      if (hasTextContinuation) {
        descHeight = maxDescOnFirstPage
      }
    }
  }

  const headerHeight = titleMetaHeight + descHeight + t.spacing.textToPhotos
  return { headerHeight, useTwoColumns, hasTextContinuation, lastContinuationHeight }
}

// ── Types ────────────────────────────────────────────────────

export interface PhotoBox {
  photo: ClassifiedPhoto
  left: number
  top: number
  width: number
  height: number
}

export interface PageContent {
  chapterHeader?: {
    chapter: Chapter
    textHeight: number
    useTwoColumns: boolean
  }
  continuationTextHeight?: number
  photos: PhotoBox[]
}

// ── Helpers ──────────────────────────────────────────────────

function sortByAspectRatio(photos: ClassifiedPhoto[]): ClassifiedPhoto[] {
  return [...photos].sort((a, b) => {
    const arA = a.width / a.height
    const arB = b.width / b.height
    if (arA !== arB) return arB - arA
    return a.filename.localeCompare(b.filename)
  })
}

interface RowInfo {
  indices: number[]
  height: number
}

function groupByRow(boxes: Array<{ height: number; row: number }>): RowInfo[] {
  const rowMap = new Map<number, RowInfo>()
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i]
    let row = rowMap.get(box.row)
    if (!row) {
      row = { indices: [], height: box.height }
      rowMap.set(box.row, row)
    }
    row.indices.push(i)
    if (box.height > row.height) row.height = box.height
  }
  return Array.from(rowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map((e) => e[1])
}

type Layout = ReturnType<typeof justifiedLayout>

/** Bounding-box width (widest row) and stacked height of a laid-out block. */
function blockBounds(layout: Layout): { width: number; height: number } {
  const rowRightEdge = new Map<number, number>()
  for (const box of layout.boxes) {
    const right = box.left + box.width
    rowRightEdge.set(box.row, Math.max(rowRightEdge.get(box.row) ?? 0, right))
  }
  return { width: Math.max(...rowRightEdge.values()), height: layout.containerHeight }
}

/**
 * Choose the row grouping that covers the most page area once the block is
 * uniformly scaled to fit (aspect preserved, so cover never crops).
 *
 * The grouping (photos-per-row) is the only free variable — once it's fixed,
 * justifiedLayout pins the row heights. Sweeping the target row height enumerates
 * the candidate groupings; for each we score the final covered area s²·A, where
 * s = min(widthFit, heightFit) is the uniform fit scale. This naturally prefers a
 * balanced grouping that slightly overflows and downscales (e.g. 2-2 of squarish
 * landscapes at ~90%) over a lopsided one that fits exactly (3-1) — the balanced
 * block keeps photos bigger. The maximum lands on the block height nearest the
 * page height, with overshoot gently penalised by s².
 */
function selectBestLayout(aspectRatios: number[], availableHeight: number): Layout {
  const STEPS = 48
  const minTarget = 40
  let best: Layout | null = null
  let bestScore = -1

  for (let i = 0; i <= STEPS; i++) {
    const target = minTarget + ((availableHeight - minTarget) * i) / STEPS
    const layout = justifiedLayout(aspectRatios, {
      containerWidth: contentWidth,
      boxSpacing: t.spacing.photoGutter,
      targetRowHeight: target,
    })
    const { width, height } = blockBounds(layout)
    const naturalArea = layout.boxes.reduce((sum, b) => sum + b.width * b.height, 0)
    const s = Math.min(contentWidth / width, availableHeight / height)
    const score = s * s * naturalArea
    if (score > bestScore) {
      bestScore = score
      best = layout
    }
  }

  return best!
}

/**
 * Fit a pre-selected set of photos to the page, preserving every photo's
 * aspect ratio — never stretches one axis, so objectFit:cover has nothing to crop.
 *
 * Picks the area-optimal row grouping (see selectBestLayout), then scales the
 * whole block uniformly to fit. Downscaling a balanced-but-slightly-tall block is
 * preferred over an exact-fit lopsided one. Over-tall blocks (a single portrait is
 * always taller than a landscape page) pillarbox; whichever axis binds, the other
 * is centered. Scaling is uniform in both directions, so nothing is ever cropped.
 */
function scalePageToFill(photos: ClassifiedPhoto[], availableHeight: number): PhotoBox[] {
  if (photos.length === 0) return []

  const aspectRatios = photos.map((p) => p.width / p.height)

  const result = selectBestLayout(aspectRatios, availableHeight)

  // Bounding box of the laid-out block: widest row × stacked height.
  const rowRightEdge = new Map<number, number>()
  for (const box of result.boxes) {
    const right = box.left + box.width
    rowRightEdge.set(box.row, Math.max(rowRightEdge.get(box.row) ?? 0, right))
  }
  const blockWidth = Math.max(...rowRightEdge.values())
  const blockHeight = result.containerHeight

  // Uniform scale to the largest size that fits the page. Aspect ratio is
  // preserved, so cover never crops; the non-binding axis gets centered slack.
  const scale = Math.min(contentWidth / blockWidth, availableHeight / blockHeight)
  const offsetY = (availableHeight - blockHeight * scale) / 2

  // Each row is centered horizontally: full rows fill the width (offset 0),
  // partial rows (e.g. one orphan photo) shift to the horizontal center.
  return result.boxes.map((box, i) => {
    const rowWidth = rowRightEdge.get(box.row) ?? blockWidth
    const offsetX = (contentWidth - rowWidth * scale) / 2
    return {
      photo: photos[i],
      left: box.left * scale + offsetX,
      top: box.top * scale + offsetY,
      width: box.width * scale,
      height: box.height * scale,
    }
  })
}

// ── Main entry point ─────────────────────────────────────────

/**
 * Pack a chapter's photos into pages.
 *
 * Text and photos are fully separated: the chapter header always occupies its
 * own page, and photo pages are all full-height. This keeps the photo layout
 * algorithm clean — no reduced-height first pages, no text/photo mixing.
 *
 * Algorithm for photo pages:
 * 1. Sort photos by aspect ratio.
 * 2. Build a global strip at fullPageHeight/2 to get the full row structure.
 * 3. Distribute rows evenly across P = ceil(R/2) pages.
 * 4. Fit each page's photos with scalePageToFill() — uniform scale, no crop.
 */
export function packChapterPages(
  chapter: Chapter,
  photos: ClassifiedPhoto[],
  fontMetrics: FontMetrics,
): PageContent[] {
  const textMetrics = measureChapterText(chapter, fontMetrics)
  const header = {
    chapter,
    textHeight: textMetrics.headerHeight,
    useTwoColumns: textMetrics.useTwoColumns,
  }

  // Text always gets its own page — no mixing with photos
  const pages: PageContent[] = [{ chapterHeader: header, photos: [] }]

  if (photos.length === 0) return pages

  const sorted = sortByAspectRatio(photos)
  const aspectRatios = sorted.map((p) => p.width / p.height)

  // Step 1: Global strip — determines row groupings for even distribution
  const strip = justifiedLayout(aspectRatios, {
    containerWidth: contentWidth,
    boxSpacing: t.spacing.photoGutter,
    targetRowHeight: fullPageHeight / 2,
  })
  const allRows = groupByRow(strip.boxes)

  // Step 2: Distribute rows evenly — P = ceil(R / 2), targeting 2 rows per page
  const R = allRows.length
  const pageCount = Math.ceil(R / 2)
  const baseRows = Math.floor(R / pageCount)
  const extraPages = R % pageCount
  const rowsPerPage: number[] = Array(pageCount).fill(baseRows)
  // Extra rows go to the first pages so the last page is never sparser
  for (let i = 0; i < extraPages; i++) rowsPerPage[i]++

  // Absorb a 1-row last page into the previous to avoid sparse finals
  if (pageCount >= 2 && rowsPerPage[pageCount - 1] === 1) {
    rowsPerPage[pageCount - 2]++
    rowsPerPage.pop()
  }

  // Step 3: Emit one page per assignment
  let cursor = 0
  for (const rowCount of rowsPerPage) {
    const pagePhotos = allRows
      .slice(cursor, cursor + rowCount)
      .flatMap((r) => r.indices.map((i) => sorted[i]))
    pages.push({ photos: scalePageToFill(pagePhotos, fullPageHeight) })
    cursor += rowCount
  }

  return pages
}
