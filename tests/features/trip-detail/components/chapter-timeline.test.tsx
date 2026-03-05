import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { ChapterTimeline } from "@/features/trip-detail/components/chapter-timeline"
import type { Chapter } from "@/types/trip"

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 100,
    tripId: 1,
    displayName: "Chapter One",
    description: null,
    slug: "chapter-one",
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

describe("ChapterTimeline", () => {
  it("renders all chapters", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Bangkok" }),
      makeChapter({ id: 2, displayName: "Chiang Mai" }),
      makeChapter({ id: 3, displayName: "Luang Prabang" }),
    ]

    render(<ChapterTimeline chapters={chapters} />)

    expect(screen.getByText("Bangkok")).toBeInTheDocument()
    expect(screen.getByText("Chiang Mai")).toBeInTheDocument()
    expect(screen.getByText("Luang Prabang")).toBeInTheDocument()
  })

  it("renders chapters in the order they are provided", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "First", startTime: 1000000 }),
      makeChapter({ id: 2, displayName: "Second", startTime: 2000000 }),
      makeChapter({ id: 3, displayName: "Third", startTime: 3000000 }),
    ]

    render(<ChapterTimeline chapters={chapters} />)

    const headings = screen.getAllByRole("heading", { level: 2 })
    expect(headings[0]).toHaveTextContent("First")
    expect(headings[1]).toHaveTextContent("Second")
    expect(headings[2]).toHaveTextContent("Third")
  })

  it("shows the empty state when no chapters are provided", () => {
    render(<ChapterTimeline chapters={[]} />)

    expect(
      screen.getByText("No chapters recorded for this trip.")
    ).toBeInTheDocument()
  })

  it("does not show the empty message when chapters exist", () => {
    render(
      <ChapterTimeline chapters={[makeChapter({ id: 1, displayName: "Bangkok" })]} />
    )

    expect(
      screen.queryByText("No chapters recorded for this trip.")
    ).not.toBeInTheDocument()
  })

  it("wraps in a section with aria-label for accessibility", () => {
    render(<ChapterTimeline chapters={[]} />)

    const section = screen.getByRole("region", { name: "Chapter timeline" })
    expect(section).toBeInTheDocument()
  })

  it("renders the correct number of chapter cards", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "A" }),
      makeChapter({ id: 2, displayName: "B" }),
    ]

    render(<ChapterTimeline chapters={chapters} />)

    const headings = screen.getAllByRole("heading", { level: 2 })
    expect(headings).toHaveLength(2)
  })
})
