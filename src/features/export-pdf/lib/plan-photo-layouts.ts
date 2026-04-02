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

/**
 * Scale a pre-selected set of photos to fill availableHeight exactly.
 *
 * Runs a local strip at availableHeight/2 to determine the correct row grouping
 * for this height, then scales row height to fill the page edge-to-edge.
 */
function scalePageToFill(photos: ClassifiedPhoto[], availableHeight: number): PhotoBox[] {
  if (photos.length === 0) return []

  const aspectRatios = photos.map((p) => p.width / p.height)

  // One run at availableHeight/2 to get the row grouping.
  // Scale top/height by availableHeight/containerHeight to fill the page exactly.
  // Width/left are already correct — justifiedLayout fills containerWidth horizontally.
  // The slight vertical aspect-ratio shift is invisible with objectFit:cover.
  const result = justifiedLayout(aspectRatios, {
    containerWidth: contentWidth,
    boxSpacing: t.spacing.photoGutter,
    targetRowHeight: availableHeight / 2,
  })

  const yScale = availableHeight / result.containerHeight

  // Center each row: compute the rightmost edge of each row, derive offset to center it.
  // For full rows justifiedLayout fills contentWidth so offset is 0. For partial last
  // rows (e.g. one orphan photo) the offset shifts them to the horizontal center.
  const rowRightEdge = new Map<number, number>()
  for (const box of result.boxes) {
    const right = box.left + box.width
    rowRightEdge.set(box.row, Math.max(rowRightEdge.get(box.row) ?? 0, right))
  }

  return result.boxes.map((box, i) => {
    const rowWidth = rowRightEdge.get(box.row) ?? contentWidth
    const centerOffset = (contentWidth - rowWidth) / 2
    return {
      photo: photos[i],
      left: box.left + centerOffset,
      top: box.top * yScale,
      width: box.width,
      height: box.height * yScale,
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
 * 4. Scale each page to fill with scalePageToFill().
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
