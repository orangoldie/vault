/**
 * Accurate text measurement using react-pdf's internal fontkit.
 *
 * Uses Font.getFont() to access the same font instances that react-pdf
 * renders with, then calls font.layout(text).advanceWidth for real
 * glyph-level width measurement. Replaces the avgCharWidthRatio heuristic.
 */
import { Font } from "@react-pdf/renderer"

// ── Types ───────────────────────────────────────────────────

export interface FontMetrics {
  layout: (text: string) => { advanceWidth: number }
  unitsPerEm: number
}

// ── Font cache ──────────────────────────────────────────────

const fontCache = new Map<string, FontMetrics>()

function cacheKey(family: string, weight: number): string {
  return `${family}:${weight}`
}

/**
 * Load and cache a font's metrics for measurement.
 * Must be called after Font.register() for the given family.
 */
export async function loadFontMetrics(
  family: string,
  weight: number = 400,
): Promise<FontMetrics> {
  const key = cacheKey(family, weight)
  const cached = fontCache.get(key)
  if (cached) return cached

  const fontSource = Font.getFont({ fontFamily: family, fontWeight: weight })
  await fontSource.load()

  if (!fontSource.data) {
    throw new Error(`Failed to load font: ${family} ${weight}`)
  }

  const font = fontSource.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- unitsPerEm exists on TTF fonts but not in the type
  const unitsPerEm = "unitsPerEm" in font ? (font as any).unitsPerEm : 1000

  const metrics: FontMetrics = {
    layout: (text: string) => font.layout(text),
    unitsPerEm,
  }

  fontCache.set(key, metrics)
  return metrics
}

// ── Measurement ─────────────────────────────────────────────

/**
 * Measure the width of a text string in points using real glyph metrics.
 */
export function measureTextWidth(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
): number {
  const { advanceWidth } = metrics.layout(text)
  return advanceWidth * (fontSize / metrics.unitsPerEm)
}

/**
 * Count how many lines a text string wraps to at a given font size
 * and column width, using word-level wrapping with real glyph widths.
 */
export function measureLineCount(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
  columnWidthPt: number,
): number {
  if (!text) return 0

  const scale = fontSize / metrics.unitsPerEm
  const columnWidthUnits = columnWidthPt / scale
  const spaceWidth = metrics.layout(" ").advanceWidth

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0

  let lines = 1
  let currentLineWidth = 0

  for (const word of words) {
    const wordWidth = metrics.layout(word).advanceWidth
    if (
      currentLineWidth > 0 &&
      currentLineWidth + spaceWidth + wordWidth > columnWidthUnits
    ) {
      lines++
      currentLineWidth = wordWidth
    } else {
      currentLineWidth +=
        (currentLineWidth > 0 ? spaceWidth : 0) + wordWidth
    }
  }

  return lines
}

/**
 * Compute the vertical height in points that a text block occupies.
 */
export function measureTextHeight(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
  lineHeight: number,
  columnWidthPt: number,
): number {
  const lines = measureLineCount(metrics, text, fontSize, columnWidthPt)
  return lines * fontSize * lineHeight
}

/**
 * Word-wrap a paragraph into visual lines that fit the given column width.
 * Returns an array of strings, each representing one rendered line.
 */
export function wordWrapLines(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
  columnWidthPt: number,
): string[] {
  if (!text) return []

  const scale = fontSize / metrics.unitsPerEm
  const columnWidthUnits = columnWidthPt / scale
  const spaceWidth = metrics.layout(" ").advanceWidth

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let currentWords: string[] = []
  let currentLineWidth = 0

  for (const word of words) {
    const wordWidth = metrics.layout(word).advanceWidth
    if (
      currentLineWidth > 0 &&
      currentLineWidth + spaceWidth + wordWidth > columnWidthUnits
    ) {
      lines.push(currentWords.join(" "))
      currentWords = [word]
      currentLineWidth = wordWidth
    } else {
      currentWords.push(word)
      currentLineWidth +=
        (currentLineWidth > 0 ? spaceWidth : 0) + wordWidth
    }
  }

  if (currentWords.length > 0) {
    lines.push(currentWords.join(" "))
  }

  return lines
}

/**
 * Count total visual lines for text with paragraph breaks (\n).
 * Each \n starts a new line regardless of remaining width — matches
 * the rendering path where \n-split segments are wrapped independently.
 */
export function measureParagraphLineCount(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
  columnWidthPt: number,
): number {
  if (!text) return 0

  const paragraphs = text.split("\n")
  let totalLines = 0

  for (const para of paragraphs) {
    if (!para) {
      totalLines += 1
    } else {
      const lines = wordWrapLines(metrics, para, fontSize, columnWidthPt)
      totalLines += lines.length || 1
    }
  }

  return totalLines
}

// ── Two-column page capacity ────────────────────────────────

/**
 * Compute max lines per column for two-column layout.
 * Shared between planning (measureChapterText) and rendering
 * (getTextColumnPages) so both use identical thresholds.
 */
export function twoColumnCapacity(
  fullPageHeight: number,
  titleMetaHeight: number,
  descMarginTop: number,
  fontSize: number,
  lineHeight: number,
): { maxLinesFirstPage: number; maxLinesFullPage: number; renderedLineHeight: number } {
  const renderedLineHeight = fontSize * lineHeight
  const firstPageAvailable = fullPageHeight - titleMetaHeight - descMarginTop
  const maxLinesFirstPage = Math.floor(firstPageAvailable / renderedLineHeight)
  const maxLinesFullPage = Math.floor(fullPageHeight / renderedLineHeight)
  return { maxLinesFirstPage, maxLinesFullPage, renderedLineHeight }
}

/**
 * Clear the font cache (useful for testing).
 */
export function clearFontCache(): void {
  fontCache.clear()
}
