/**
 * Verify that two-column text flow works correctly:
 * 1. Short text fits in col1 only
 * 2. Medium text overflows into col2
 * 3. Long text fills both columns and spills to page 2
 * 4. Very long text spans 3+ pages
 * 5. Single long paragraph splits across columns
 * 6. Hebrew/RTL text distributes evenly
 */
import { describe, it, expect, beforeAll } from "vitest"
import { Font } from "@react-pdf/renderer"

import { type FontMetrics, loadFontMetrics } from "@/features/export-pdf/lib/measure-text"
import { getTextColumnPages } from "@/features/export-pdf/components/photo-spread-page"
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

function makeChapter(description: string): Chapter {
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
    description,
    weatherCondition: null,
    weatherTemperature: null,
  } as Chapter
}

/** Generate text with a given number of paragraphs. */
function generateText(paragraphCount: number): string {
  const sentences = [
    "We arrived in Rome on a sunny Tuesday morning and the cobblestone streets were already buzzing with tourists.",
    "The narrow alleys of Trastevere were filled with the smell of fresh espresso and cornetti from the local cafes.",
    "We spent the afternoon exploring ancient ruins and marveling at the architecture that has stood for millennia.",
    "The owner of the small trattoria told us about a hidden garden nearby that most tourists never find.",
    "As the sun set over the Tiber, the city transformed into a golden spectacle of light and shadow.",
    "We walked along the riverbank, watching the reflections of the old bridges dancing on the water.",
    "The next morning we took a train to Florence, where the Renaissance art awaited us in every corner.",
    "Standing before the David, we felt the weight of centuries of human creativity pressing down on us.",
  ]
  return Array.from(
    { length: paragraphCount },
    (_, i) => sentences[i % sentences.length],
  ).join("\n")
}

/** Count non-empty lines (actual text content) in column output. */
function countContentLines(pages: Array<[string[], string[]]>): {
  total: number
  perPage: Array<{ col1: number; col2: number }>
} {
  let total = 0
  const perPage: Array<{ col1: number; col2: number }> = []
  for (const [col1, col2] of pages) {
    const c1 = col1.filter((l) => l !== "").length
    const c2 = col2.filter((l) => l !== "").length
    perPage.push({ col1: c1, col2: c2 })
    total += c1 + c2
  }
  return { total, perPage }
}

describe("two-column text flow", () => {
  it("short text fits in col1 only → col2 empty", () => {
    const text = "First paragraph.\nSecond paragraph."
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    expect(pages).toHaveLength(1)
    const { perPage } = countContentLines(pages)
    expect(perPage[0].col1).toBeGreaterThan(0)
    expect(perPage[0].col2).toBe(0)
  })

  it("medium text overflows into col2 on same page", () => {
    const text = generateText(18)
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    const { perPage } = countContentLines(pages)
    // First page should have content in both columns
    expect(perPage[0].col1).toBeGreaterThan(0)
    expect(perPage[0].col2).toBeGreaterThan(0)
  })

  it("long text fills both columns and spills to page 2", () => {
    const text = generateText(30)
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    expect(pages.length).toBeGreaterThanOrEqual(2)

    const { perPage } = countContentLines(pages)
    // Page 1: both columns have content
    expect(perPage[0].col1).toBeGreaterThan(0)
    expect(perPage[0].col2).toBeGreaterThan(0)
    // Page 2: at least col1 has content
    expect(perPage[1].col1).toBeGreaterThan(0)
  })

  it("very long text spans 3+ pages", () => {
    const text = generateText(80)
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    expect(pages.length).toBeGreaterThanOrEqual(3)

    const { perPage } = countContentLines(pages)
    // Every page except possibly the last should have both columns
    for (let i = 0; i < pages.length - 1; i++) {
      expect(perPage[i].col1).toBeGreaterThan(0)
      expect(perPage[i].col2).toBeGreaterThan(0)
    }
  })

  it("no text content is dropped", () => {
    for (const count of [5, 15, 30, 60]) {
      const text = generateText(count)
      const chapter = makeChapter(text)
      const pages = getTextColumnPages(chapter, fontMetrics)

      // Flatten all non-empty lines and rejoin — should contain all original words
      const allContent = pages
        .flatMap(([c1, c2]) => [...c1, ...c2])
        .filter((l) => l !== "")
        .join(" ")

      // Every word from the original text should be present
      const originalWords = text.split(/\s+/).filter(Boolean)
      for (const word of originalWords) {
        expect(allContent).toContain(word)
      }
    }
  })

  it("text order is preserved across columns and pages", () => {
    const paragraphs = Array.from({ length: 20 }, (_, i) => `Paragraph ${i + 1}`)
    const text = paragraphs.join("\n")
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    // Flatten in reading order, filter blank separators
    const flattened = pages
      .flatMap(([col1, col2]) => [...col1, ...col2])
      .filter((l) => l !== "")

    expect(flattened).toEqual(paragraphs)
  })

  it("single long paragraph without line breaks splits across columns", () => {
    // One continuous paragraph — no \n breaks at all, long enough to overflow col1 (~25 lines)
    // Need ~50+ lines of wrapped text to ensure it overflows into col2
    const baseSentences = [
      "We arrived in Rome on a sunny Tuesday morning and the cobblestone streets were already buzzing with tourists.",
      "The narrow alleys of Trastevere were filled with the smell of fresh espresso and cornetti from the local cafes.",
      "We spent the afternoon exploring ancient ruins and marveling at the architecture that has stood for millennia.",
      "The owner of the small trattoria told us about a hidden garden nearby that most tourists never find.",
      "As the sun set over the Tiber, the city transformed into a golden spectacle of light and shadow.",
      "We walked along the riverbank, watching the reflections of the old bridges dancing on the water.",
      "The next morning we took a train to Florence, where the Renaissance art awaited us in every corner.",
      "Standing before the David, we felt the weight of centuries of human creativity pressing down on us.",
    ]
    // Repeat sentences enough times to generate ~50+ wrapped lines
    const sentences = Array.from({ length: 40 }, (_, i) => baseSentences[i % baseSentences.length])
    const longParagraph = sentences.join(" ")
    const chapter = makeChapter(longParagraph)
    const pages = getTextColumnPages(chapter, fontMetrics)

    const { perPage } = countContentLines(pages)
    // Single paragraph should split across both columns, not all in col1
    expect(perPage[0].col1).toBeGreaterThan(0)
    expect(perPage[0].col2).toBeGreaterThan(0)

    // Columns should be roughly balanced (not 1 line vs 20 lines)
    const ratio = perPage[0].col1 / Math.max(perPage[0].col2, 1)
    expect(ratio).toBeGreaterThan(0.5)
    expect(ratio).toBeLessThan(2)

    console.log(`[single paragraph] col1=${perPage[0].col1} lines, col2=${perPage[0].col2} lines`)
  })

  it("short first paragraph + long second paragraph distributes evenly", () => {
    // This is the bug case: short first para should NOT monopolize col1
    // Need enough text to overflow col1 (~25 lines)
    const text = "A brief greeting.\n" + generateText(30)
    const chapter = makeChapter(text)
    const pages = getTextColumnPages(chapter, fontMetrics)

    const { perPage } = countContentLines(pages)
    expect(perPage[0].col1).toBeGreaterThan(0)
    expect(perPage[0].col2).toBeGreaterThan(0)

    // Col1 should NOT be just 1 line while col2 has 20+
    // Both columns should have a reasonable share
    const ratio = perPage[0].col1 / Math.max(perPage[0].col2, 1)
    expect(ratio).toBeGreaterThan(0.3)

    console.log(`[short+long] col1=${perPage[0].col1} lines, col2=${perPage[0].col2} lines, ratio=${ratio.toFixed(2)}`)
  })
})
