import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { ChapterSection } from "@/features/trip-detail/components/chapter-section"
import type { Chapter, Photo } from "@/types/trip"

// Mock framer-motion to avoid animation complexities in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion")
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
    useInView: () => true,
  }
})

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 100,
    tripId: 1,
    displayName: "Bangkok",
    description: null,
    slug: "bangkok",
    startTime: 1739059200,
    endTime: null,
    location: {
      name: "Bangkok",
      detail: "Bangkok, Thailand",
      fullDetail: "Bangkok, Thailand",
      countryCode: "TH",
      lat: 13.7,
      lon: 100.5,
    },
    weatherCondition: null,
    weatherTemperature: null,
    uuid: "uuid-chapter-100",
    ...overrides,
  }
}

function makePhoto(id: string, chapterId = 100): Photo {
  return { id, tripId: 1, chapterId, filename: `${id}.jpg` }
}

describe("ChapterSection", () => {
  it("renders chapter display name as an h2 with serif font", () => {
    render(
      <ChapterSection
        chapter={makeChapter()}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toHaveTextContent("Bangkok")
    expect(heading).toHaveClass("font-serif")
  })

  it("renders the section with an accessible label", () => {
    render(
      <ChapterSection
        chapter={makeChapter()}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    const section = screen.getByRole("region", { name: "Chapter: Bangkok" })
    expect(section).toBeInTheDocument()
  })

  it("renders country flag before location detail", () => {
    render(
      <ChapterSection
        chapter={makeChapter()}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    const flag = document.querySelector(".fi.fi-th")
    expect(flag).toBeInTheDocument()
  })

  it("renders description when present", () => {
    render(
      <ChapterSection
        chapter={makeChapter({ description: "Arrived late at night." })}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    expect(screen.getByText("Arrived late at night.")).toBeInTheDocument()
  })

  it("does not render description when null", () => {
    const { container } = render(
      <ChapterSection
        chapter={makeChapter({ description: null })}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    const paragraphs = container.querySelectorAll("p.whitespace-pre-line")
    expect(paragraphs).toHaveLength(0)
  })

  it("renders all photos in the postcard grid when provided", () => {
    const photos = [makePhoto("p1"), makePhoto("p2")]
    const urls = new Map([
      ["p1", "blob:http://localhost/p1"],
      ["p2", "blob:http://localhost/p2"],
    ])

    render(
      <ChapterSection
        chapter={makeChapter()}
        photos={photos}
        photoUrls={urls}
      />
    )

    // All photos go into the postcard grid (no separate hero)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it("renders nothing for photos section when no photos exist", () => {
    const { container } = render(
      <ChapterSection
        chapter={makeChapter()}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    // No photo buttons
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("renders weather icon and temperature when present", () => {
    render(
      <ChapterSection
        chapter={makeChapter({
          weatherCondition: "partly-cloudy-day",
          weatherTemperature: 31.4,
        })}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    // Weather icon has aria-label (kebab stripped, day/night removed)
    expect(screen.getByLabelText("partly cloudy")).toBeInTheDocument()
    // Temperature rendered separately
    expect(screen.getByText("31°C")).toBeInTheDocument()
  })

  it("includes sentinel div for intersection observer", () => {
    const { container } = render(
      <ChapterSection
        chapter={makeChapter({ id: 42 })}
        photos={[]}
        photoUrls={new Map()}
      />
    )

    const sentinel = container.querySelector("[data-chapter-sentinel]")
    expect(sentinel).toBeInTheDocument()
    expect(sentinel).toHaveAttribute("data-chapter-id", "42")
  })
})
