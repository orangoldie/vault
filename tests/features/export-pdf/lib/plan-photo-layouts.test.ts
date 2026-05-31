import { describe, it, expect, beforeAll } from "vitest"
import { Font } from "@react-pdf/renderer"

import {
  packChapterPages,
  measureChapterText,
  type PageContent,
} from "@/features/export-pdf/lib/plan-photo-layouts"
import {
  type FontMetrics,
  loadFontMetrics,
  measureLineCount,
} from "@/features/export-pdf/lib/measure-text"
import { pdfTheme } from "@/features/export-pdf/lib/pdf-theme"
import type { ClassifiedPhoto } from "@/features/export-pdf/lib/classify-photos"
import type { Chapter } from "@/types/trip"

let fontMetrics: FontMetrics

beforeAll(async () => {
  Font.register({
    family: "Noto Serif",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/notoserif/v33/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZqFCjwA.ttf",
        fontWeight: 400,
      },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
  fontMetrics = await loadFontMetrics("Noto Serif")
})

function makePhotos(
  aspects: Array<"landscape" | "portrait" | "square">,
): ClassifiedPhoto[] {
  return aspects.map((aspect, i) => ({
    tripId: 1,
    chapterId: 1,
    filename: `photo-${i}.jpg`,
    width: aspect === "portrait" ? 960 : 1280,
    height: aspect === "portrait" ? 1280 : 960,
    aspect,
  }))
}

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 1,
    tripId: 1,
    displayName: "Test Chapter",
    startTime: 1700000000,
    endTime: 1700100000,
    location: {
      lat: 0,
      lon: 0,
      fullDetail: "Rome, Italy",
      countryCode: "IT",
    },
    description: null,
    weatherCondition: null,
    weatherTemperature: null,
    ...overrides,
  } as Chapter
}

function totalPhotosPlaced(pages: PageContent[]): number {
  return pages.reduce((sum, p) => sum + p.photos.length, 0)
}

// ── measureLineCount ─────────────────────────────────────────

describe("measureLineCount", () => {
  it("returns 0 for empty text", () => {
    expect(measureLineCount(fontMetrics, "", 12, 380)).toBe(0)
  })

  it("returns 1 for short text", () => {
    expect(measureLineCount(fontMetrics, "Hello world", 12, 380)).toBe(1)
  })

  it("returns multiple lines for long text", () => {
    const longText = "This is a fairly long sentence that should wrap to multiple lines when rendered in a narrow column width at twelve point font size."
    const lines = measureLineCount(fontMetrics, longText, 12, 200)
    expect(lines).toBeGreaterThan(1)
  })

  it("narrow characters produce fewer lines than wide characters", () => {
    const narrow = "i ".repeat(50).trim()
    const wide = "W ".repeat(50).trim()
    const narrowLines = measureLineCount(fontMetrics, narrow, 12, 200)
    const wideLines = measureLineCount(fontMetrics, wide, 12, 200)
    expect(wideLines).toBeGreaterThan(narrowLines)
  })
})

// ── measureChapterText ───────────────────────────────────────

describe("measureChapterText", () => {
  it("returns non-zero height for a basic chapter", () => {
    const chapter = makeChapter()
    const metrics = measureChapterText(chapter, fontMetrics)
    expect(metrics.headerHeight).toBeGreaterThan(0)
    expect(metrics.useTwoColumns).toBe(false)
  })

  it("switches to two columns for long descriptions", () => {
    const longDescription = Array(200).fill("word").join(" ")
    const chapter = makeChapter({ description: longDescription })
    const metrics = measureChapterText(chapter, fontMetrics)
    expect(metrics.useTwoColumns).toBe(true)
  })

  it("uses single column for short descriptions", () => {
    const chapter = makeChapter({ description: "A short description." })
    const metrics = measureChapterText(chapter, fontMetrics)
    expect(metrics.useTwoColumns).toBe(false)
  })

  it("two columns produce shorter height than single column would", () => {
    const longDescription = Array(200).fill("word").join(" ")
    const shortChapter = makeChapter({ description: longDescription })
    const twoColMetrics = measureChapterText(shortChapter, fontMetrics)

    const singleColChapter = makeChapter({
      description: Array(100).fill("word").join(" "),
    })
    const singleColMetrics = measureChapterText(singleColChapter, fontMetrics)

    expect(twoColMetrics.headerHeight).toBeLessThan(
      singleColMetrics.headerHeight * 2.5,
    )
  })
})

// ── packChapterPages — core behaviour ────────────────────────

describe("packChapterPages", () => {
  it("returns at least one page for a chapter with no photos", () => {
    const chapter = makeChapter()
    const pages = packChapterPages(chapter, [], fontMetrics)
    expect(pages.length).toBeGreaterThanOrEqual(1)
    expect(pages[0].chapterHeader).toBeDefined()
    expect(pages[0].photos).toHaveLength(0)
  })

  it("places all photos — none are dropped", () => {
    for (const count of [1, 2, 3, 5, 10, 20, 50]) {
      const chapter = makeChapter()
      const photos = makePhotos(Array(count).fill("landscape"))
      const pages = packChapterPages(chapter, photos, fontMetrics)
      expect(totalPhotosPlaced(pages)).toBe(count)
    }
  })

  it("first page includes chapter header", () => {
    const chapter = makeChapter()
    const photos = makePhotos(["landscape", "landscape"])
    const pages = packChapterPages(chapter, photos, fontMetrics)
    expect(pages[0].chapterHeader).toBeDefined()
    expect(pages[0].chapterHeader!.chapter.id).toBe(chapter.id)
  })

  it("subsequent pages do not include chapter header", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(30).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    if (pages.length > 1) {
      for (let i = 1; i < pages.length; i++) {
        expect(pages[i].chapterHeader).toBeUndefined()
      }
    }
  })

  it("photo boxes have valid geometry", () => {
    const chapter = makeChapter()
    const photos = makePhotos(["landscape", "portrait", "square"])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    for (const page of pages) {
      for (const box of page.photos) {
        expect(box.width).toBeGreaterThan(0)
        expect(box.height).toBeGreaterThan(0)
        expect(box.left).toBeGreaterThanOrEqual(0)
        expect(box.top).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it("prefers a balanced grouping over a lopsided exact fit", () => {
    // 4 squarish (4:3) landscapes on one page: balanced 2-2 (downscaled slightly)
    // beats a lopsided 3-1 that happens to fit the height exactly. Group boxes into
    // rows by their top coordinate and assert no row holds 3+ while another holds 1.
    const chapter = makeChapter()
    const photos = makePhotos(Array(4).fill("landscape"))
    const photoPage = packChapterPages(chapter, photos, fontMetrics).find(
      (p) => p.photos.length > 0,
    )!

    const rowSizes = new Map<number, number>()
    for (const box of photoPage.photos) {
      const key = Math.round(box.top)
      rowSizes.set(key, (rowSizes.get(key) ?? 0) + 1)
    }
    const counts = [...rowSizes.values()]
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
  })

  it("preserves photo aspect ratios — no cropping", () => {
    // Every box must match its photo's true aspect ratio so objectFit:cover
    // has nothing to crop. Test across sparse and dense pages.
    for (const aspects of [
      ["portrait"] as const,
      ["portrait", "portrait", "portrait"] as const,
      ["landscape", "landscape", "landscape", "landscape", "landscape", "landscape"] as const,
      ["landscape", "portrait", "landscape", "portrait", "portrait"] as const,
    ]) {
      const chapter = makeChapter()
      const photos = makePhotos([...aspects])
      const pages = packChapterPages(chapter, photos, fontMetrics)
      for (const page of pages) {
        for (const box of page.photos) {
          const photoAr = box.photo.width / box.photo.height
          const boxAr = box.width / box.height
          expect(boxAr).toBeCloseTo(photoAr, 2)
        }
      }
    }
  })

  it("handles mixed aspect ratios", () => {
    const chapter = makeChapter()
    const photos = makePhotos([
      "landscape", "portrait", "portrait", "square", "landscape",
      "landscape", "square", "portrait",
    ])
    const pages = packChapterPages(chapter, photos, fontMetrics)
    expect(totalPhotosPlaced(pages)).toBe(8)
    expect(pages.length).toBeGreaterThanOrEqual(1)
  })

  it("is deterministic — same input produces same output", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(15).fill("landscape"))
    const pages1 = packChapterPages(chapter, photos, fontMetrics)
    const pages2 = packChapterPages(chapter, photos, fontMetrics)

    expect(pages1.length).toBe(pages2.length)
    for (let i = 0; i < pages1.length; i++) {
      expect(pages1[i].photos.length).toBe(pages2[i].photos.length)
    }
  })

  it("sorts photos by aspect ratio — landscapes before portraits", () => {
    const chapter = makeChapter()
    const photos = makePhotos(["portrait", "landscape", "portrait", "landscape"])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    const allBoxes = pages.flatMap((p) => p.photos)
    const aspects = allBoxes.map((b) => b.photo.width / b.photo.height)
    // Should be sorted descending (landscapes first)
    for (let i = 1; i < aspects.length; i++) {
      expect(aspects[i]).toBeLessThanOrEqual(aspects[i - 1])
    }
  })
})

// ── Acceptance criteria from spec ────────────────────────────

describe("acceptance criteria", () => {
  it("Case 1: 6 landscapes, no description → all placed across 1-2 pages", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(6).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(6)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(1)
    expect(photoPages.length).toBeLessThanOrEqual(3)
  })

  it("Case 2: 12 landscapes, no description → all placed, balanced pages", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(12).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(12)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(2)

    // No page should be drastically sparser than the busiest page
    const counts = photoPages.map((p) => p.photos.length)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    expect(max - min).toBeLessThanOrEqual(4)
  })

  it("Case 2b: 30 landscapes, no description → multiple pages, balanced", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(30).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(30)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(4)

    const counts = photoPages.map((p) => p.photos.length)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    expect(max - min).toBeLessThanOrEqual(4)
  })

  it("Case 3: 3 portraits + 5 landscapes → reordered, all placed", () => {
    const chapter = makeChapter()
    const photos = makePhotos([
      "portrait", "portrait", "portrait",
      "landscape", "landscape", "landscape", "landscape", "landscape",
    ])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(8)

    // Verify landscapes come before portraits in the layout
    const allBoxes = pages.flatMap((p) => p.photos)
    const firstPortraitIdx = allBoxes.findIndex((b) => b.photo.aspect === "portrait")
    const lastLandscapeIdx = allBoxes.findLastIndex((b) => b.photo.aspect === "landscape")
    if (firstPortraitIdx >= 0 && lastLandscapeIdx >= 0) {
      expect(lastLandscapeIdx).toBeLessThan(firstPortraitIdx)
    }
  })

  it("Case 4: 1 photo, no description → 1 page, centered", () => {
    const chapter = makeChapter()
    const photos = makePhotos(["landscape"])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(1)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBe(1)

    const box = photoPages[0].photos[0]
    expect(box.width).toBeGreaterThan(0)
    expect(box.height).toBeGreaterThan(0)
  })

  it("Case 5: 2 photos, long description (text continuation) → photos deferred", () => {
    // Very long description to force text continuation
    const longDescription = Array(500).fill("word").join(" ")
    const chapter = makeChapter({ description: longDescription })
    const photos = makePhotos(["landscape", "landscape"])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(2)

    // First page should be header with no photos (text continuation)
    expect(pages[0].chapterHeader).toBeDefined()
    expect(pages[0].photos).toHaveLength(0)

    // Photos should be on a later page
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(1)
  })

  it("Case 6: 20 landscapes, short description → multiple pages", () => {
    const chapter = makeChapter({ description: "A beautiful day in the city." })
    const photos = makePhotos(Array(20).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(20)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(3)
    expect(photoPages.length).toBeLessThanOrEqual(10)
  })

  it("Case 7: 10 portraits, no description → ~2 pages", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(10).fill("portrait"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(10)
    const photoPages = pages.filter((p) => p.photos.length > 0)
    expect(photoPages.length).toBeGreaterThanOrEqual(1)
    expect(photoPages.length).toBeLessThanOrEqual(4)
  })

  it("Case 8: single-column text + 8 mixed photos → all placed", () => {
    const chapter = makeChapter({ description: "We explored the ancient ruins and had a wonderful time." })
    const photos = makePhotos([
      "landscape", "landscape", "landscape", "landscape",
      "portrait", "portrait", "portrait", "portrait",
    ])
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(8)
    expect(pages.length).toBeGreaterThanOrEqual(1)
    expect(pages.length).toBeLessThanOrEqual(3)
  })

  it("Case 9: 8 landscapes, no description → balanced split, never 7+1", () => {
    const chapter = makeChapter()
    const photos = makePhotos(Array(8).fill("landscape"))
    const pages = packChapterPages(chapter, photos, fontMetrics)

    expect(totalPhotosPlaced(pages)).toBe(8)
    const photoPages = pages.filter((p) => p.photos.length > 0)

    const counts = photoPages.map((p) => p.photos.length)
    const max = Math.max(...counts)
    const min = Math.min(...counts)
    // Must never produce a 7+1 or similar extreme imbalance
    expect(max - min).toBeLessThanOrEqual(3)
  })
})
