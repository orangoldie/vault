import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

import type { Chapter } from "@/types/trip"
import { formatDate, formatDateRange } from "@/lib/format-date"

import { type PhotoBox } from "../lib/plan-photo-layouts"
import { type FontMetrics, wordWrapLines, twoColumnCapacity } from "../lib/measure-text"
import { pdfTheme, contentWidth, fullPageHeight, titleMetaHeight, descriptionMarginTop } from "../lib/pdf-theme"
import { resolveLineStyle } from "../lib/pdf-fonts"
import { getWeatherSymbol } from "../lib/weather-symbols"
import { countryCodeToFlagEmoji } from "../lib/country-flag-emoji"
import { PageNumber } from "./page-number"

const t = pdfTheme

const styles = StyleSheet.create({
  page: {
    padding: t.spacing.pageMargin,
    backgroundColor: t.colors.background,
    position: "relative",
  },
  chapterTitle: {
    fontFamily: t.fonts.display,
    fontSize: t.sizes.chapterTitle,
    lineHeight: t.lineHeights.chapterTitle,
    color: t.colors.primary,
  },
  meta: {
    fontFamily: t.fonts.body,
    fontSize: t.sizes.meta,
    lineHeight: t.lineHeights.meta,
    color: t.colors.muted,
    marginTop: 6,
  },
  descriptionBlock: {
    marginTop: descriptionMarginTop,
  },
  descriptionLine: {
    fontFamily: t.fonts.display,
    fontSize: t.sizes.body,
    lineHeight: t.lineHeights.body,
    color: t.colors.primary,
  },
  twoColumnContainer: {
    flexDirection: "row",
    gap: t.spacing.columnGap,
    marginTop: descriptionMarginTop,
  },
  twoColumnContainerContinuation: {
    flexDirection: "row",
    gap: t.spacing.columnGap,
  },
  column: {
    flex: 1,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    position: "absolute",
    objectFit: "cover",
    objectPosition: "center",
  },
})

// ── Text utilities ───────────────────────────────────────────

export function detectDescriptionRtl(text: string): boolean {
  const style = resolveLineStyle(text.slice(0, 200), "display")
  return style.direction === "rtl" || style.textAlign === "right"
}

/**
 * Split paragraphs into column-pair pages using line-level flow.
 *
 * Word-wraps each paragraph into visual lines using fontkit, then distributes
 * lines across col1 → col2 → next page col1 → col2, splitting mid-paragraph
 * when needed. Empty lines between paragraphs are preserved.
 *
 * Returns array of [col1Lines, col2Lines] tuples per page.
 */
function flowIntoColumnPages(
  paragraphs: string[],
  maxLinesFirstPage: number,
  maxLinesFullPage: number,
  fontMetrics: FontMetrics,
): Array<[string[], string[]]> {
  const fontSize = t.sizes.body
  const columnWidth = (contentWidth - t.spacing.columnGap) / 2

  // Word-wrap all paragraphs into visual lines, with empty strings as paragraph separators
  const allLines: string[] = []
  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi]
    if (!para) {
      // Empty paragraph → blank line
      allLines.push("")
    } else {
      const wrapped = wordWrapLines(fontMetrics, para, fontSize, columnWidth)
      allLines.push(...(wrapped.length > 0 ? wrapped : [""]))
    }
    // No blank separator — \n means line break, not paragraph gap
    // (matches SingleColumnDescription which renders \n-splits without extra spacing)
  }

  // Flow lines across columns and pages
  const pages: Array<[string[], string[]]> = []
  let lineIdx = 0
  let isFirstPage = true

  while (lineIdx < allLines.length) {
    const maxLines = isFirstPage ? maxLinesFirstPage : maxLinesFullPage
    const col1: string[] = []
    const col2: string[] = []

    // Fill col1
    while (lineIdx < allLines.length && col1.length < maxLines) {
      col1.push(allLines[lineIdx++])
    }

    // Fill col2
    while (lineIdx < allLines.length && col2.length < maxLines) {
      col2.push(allLines[lineIdx++])
    }

    pages.push([col1, col2])
    isFirstPage = false
  }

  // Ensure at least one page if there was any input
  if (pages.length === 0 && paragraphs.length > 0) {
    pages.push([paragraphs, []])
  }

  return pages
}

function renderColumnLines(lines: string[]) {
  return lines.map((line, i) => (
    <Text
      key={i}
      style={[styles.descriptionLine, resolveLineStyle(line, "display")]}
    >
      {line || " "}
    </Text>
  ))
}

// ── Chapter Header Block ─────────────────────────────────────

interface ChapterHeaderProps {
  chapter: Chapter
  useTwoColumns: boolean
  /** Pre-computed first-page columns for two-column layout (from getTextColumnPages). */
  firstPageColumns?: [string[], string[]]
}

function ChapterHeader({ chapter, useTwoColumns, firstPageColumns }: ChapterHeaderProps) {
  const dateRange =
    chapter.endTime && chapter.endTime !== chapter.startTime
      ? formatDateRange(chapter.startTime, chapter.endTime)
      : formatDate(chapter.startTime)

  const weatherSymbol = chapter.weatherCondition
    ? getWeatherSymbol(chapter.weatherCondition)
    : null

  const weatherText =
    weatherSymbol && chapter.weatherTemperature != null
      ? `${weatherSymbol} ${Math.round(chapter.weatherTemperature)}°C`
      : weatherSymbol
        ? weatherSymbol
        : chapter.weatherTemperature != null
          ? `${Math.round(chapter.weatherTemperature)}°C`
          : null

  // Title/meta direction from title script
  const nameStyle = resolveLineStyle(chapter.displayName, "display")
  const isTitleRtl =
    nameStyle.direction === "rtl" || nameStyle.textAlign === "right"
  const metaAlignStyle = isTitleRtl ? { textAlign: "right" as const } : {}

  // Description direction detected independently from description text
  const descRtl = chapter.description
    ? detectDescriptionRtl(chapter.description)
    : false

  return (
    <View>
      {/* Title + meta stay together */}
      <View wrap={false}>
        <Text style={[styles.chapterTitle, nameStyle]}>
          {chapter.displayName}
        </Text>
        <Text
          style={[
            styles.meta,
            resolveLineStyle(chapter.location.fullDetail, "body"),
            metaAlignStyle,
          ]}
        >
          {isTitleRtl ? (
            <>
              {weatherText ? `${weatherText} · ` : ""}
              {dateRange}
              {" · "}
              {chapter.location.countryCode
                ? `${countryCodeToFlagEmoji(chapter.location.countryCode)}  `
                : ""}
              {chapter.location.fullDetail}
            </>
          ) : (
            <>
              {chapter.location.countryCode
                ? `${countryCodeToFlagEmoji(chapter.location.countryCode)}  `
                : ""}
              {chapter.location.fullDetail}
              {` · ${dateRange}`}
              {weatherText ? ` · ${weatherText}` : ""}
            </>
          )}
        </Text>
      </View>

      {/* Description — direction detected from its own content */}
      {chapter.description &&
        (useTwoColumns && firstPageColumns ? (
          <TwoColumnDescriptionFirstPage
            col1={firstPageColumns[0]}
            col2={firstPageColumns[1]}
            isRtl={descRtl}
          />
        ) : (
          !useTwoColumns && (
            <SingleColumnDescription
              text={chapter.description}
              isRtl={descRtl}
            />
          )
        ))}
    </View>
  )
}

function SingleColumnDescription({
  text,
  isRtl,
}: {
  text: string
  isRtl: boolean
}) {
  return (
    <View
      style={[
        styles.descriptionBlock,
        { maxWidth: 380 },
        isRtl ? { alignSelf: "flex-end" } : undefined,
      ]}
    >
      {text.split("\n").map((line, i) => (
        <Text
          key={i}
          style={[styles.descriptionLine, resolveLineStyle(line, "display")]}
        >
          {line || " "}
        </Text>
      ))}
    </View>
  )
}

/**
 * Renders pre-computed two-column text for the first page (within the chapter header).
 * Columns are computed by `getTextColumnPages` to stay in sync with continuation pages.
 */
function TwoColumnDescriptionFirstPage({
  col1,
  col2,
  isRtl,
}: {
  col1: string[]
  col2: string[]
  isRtl: boolean
}) {
  const leftCol = isRtl ? col2 : col1
  const rightCol = isRtl ? col1 : col2

  return (
    <View style={styles.twoColumnContainer}>
      <View style={styles.column}>{renderColumnLines(leftCol)}</View>
      <View style={styles.column}>{renderColumnLines(rightCol)}</View>
    </View>
  )
}

// ── Photo Grid ───────────────────────────────────────────────

interface PhotoGridProps {
  photos: PhotoBox[]
  dataUrls: (string | null)[]
  offsetTop: number
}

function PhotoGrid({ photos, dataUrls, offsetTop }: PhotoGridProps) {
  if (photos.length === 0) return null

  // Compute bounding box height for the container
  let maxBottom = 0
  for (const box of photos) {
    const bottom = box.top + box.height
    if (bottom > maxBottom) maxBottom = bottom
  }

  return (
    <View
      style={[styles.photoContainer, { height: maxBottom, marginTop: offsetTop }]}
    >
      {photos.map((box, i) => {
        const src = dataUrls[i]
        if (!src) return null
        return (
          <Image
            key={box.photo.filename}
            src={src}
            style={[
              styles.photo,
              {
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
              },
            ]}
          />
        )
      })}
    </View>
  )
}

// ── Page Component ───────────────────────────────────────────

export interface ContentPageProps {
  chapterHeader?: {
    chapter: Chapter
    textHeight: number
    useTwoColumns: boolean
    /** Pre-computed first-page columns for two-column layout. */
    firstPageColumns?: [string[], string[]]
  }
  photos: PhotoBox[]
  photoDataUrls: (string | null)[]
}

/**
 * Compute all column-pair pages for a two-column chapter description.
 * Page 0 is rendered inside ChapterHeader; pages 1+ are continuation `<Page>` elements.
 * Single source of truth — both first page and continuations use the same split.
 */
export function getTextColumnPages(
  chapter: Chapter,
  fontMetrics: FontMetrics,
): Array<[string[], string[]]> {
  if (!chapter.description) return []

  const paragraphs = chapter.description.split("\n")
  const { maxLinesFirstPage, maxLinesFullPage } = twoColumnCapacity(
    fullPageHeight,
    titleMetaHeight,
    descriptionMarginTop,
    t.sizes.body,
    t.lineHeights.body,
  )

  return flowIntoColumnPages(
    paragraphs,
    maxLinesFirstPage,
    maxLinesFullPage,
    fontMetrics,
  )
}

export function TextContinuationPage({
  col1,
  col2,
  isRtl,
  photos,
  photoDataUrls,
}: {
  col1: string[]
  col2: string[]
  isRtl: boolean
  photos?: PhotoBox[]
  photoDataUrls?: (string | null)[]
}) {
  const leftCol = isRtl ? col2 : col1
  const rightCol = isRtl ? col1 : col2

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.twoColumnContainerContinuation}>
        <View style={styles.column}>{renderColumnLines(leftCol)}</View>
        <View style={styles.column}>{renderColumnLines(rightCol)}</View>
      </View>
      {photos && photos.length > 0 && photoDataUrls && (
        <PhotoGrid
          photos={photos}
          dataUrls={photoDataUrls}
          offsetTop={t.spacing.textToPhotos}
        />
      )}
      <PageNumber />
    </Page>
  )
}

export function ContentPage({
  chapterHeader,
  photos,
  photoDataUrls,
}: ContentPageProps) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {chapterHeader && (
        <ChapterHeader
          chapter={chapterHeader.chapter}
          useTwoColumns={chapterHeader.useTwoColumns}
          firstPageColumns={chapterHeader.firstPageColumns}
        />
      )}
      <PhotoGrid
        photos={photos}
        dataUrls={photoDataUrls}
        offsetTop={chapterHeader ? t.spacing.textToPhotos : 0}
      />
      <PageNumber />
    </Page>
  )
}
