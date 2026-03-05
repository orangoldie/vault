import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { ChapterCard } from "@/features/trip-detail/components/chapter-card"
import type { Chapter } from "@/types/trip"

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 100,
    tripId: 1,
    displayName: "Bangkok",
    description: null,
    slug: "bangkok",
    startTime: 1739059200, // Feb 9, 2025
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

describe("ChapterCard", () => {
  it("renders the chapter display name as an h2", () => {
    render(<ChapterCard chapter={makeChapter()} />)

    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toHaveTextContent("Bangkok")
  })

  it("renders the location detail", () => {
    render(<ChapterCard chapter={makeChapter()} />)

    expect(screen.getByText("Bangkok, Thailand")).toBeInTheDocument()
  })

  it("renders a single date when endTime is null", () => {
    render(<ChapterCard chapter={makeChapter({ endTime: null })} />)

    expect(screen.getByText("Feb 9, 2025")).toBeInTheDocument()
  })

  it("renders a single date when endTime equals startTime", () => {
    render(
      <ChapterCard
        chapter={makeChapter({ startTime: 1739059200, endTime: 1739059200 })}
      />
    )

    expect(screen.getByText("Feb 9, 2025")).toBeInTheDocument()
  })

  it("renders a date range when endTime differs from startTime", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          startTime: 1739059200, // Feb 9, 2025
          endTime: 1739491200, // Feb 14, 2025
        })}
      />
    )

    // Should contain both dates with en-dash
    expect(screen.getByText(/Feb 9/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 14/)).toBeInTheDocument()
  })

  it("renders weather condition and temperature when both present", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          weatherCondition: "Partly Cloudy",
          weatherTemperature: 31.4,
        })}
      />
    )

    expect(screen.getByText("Partly Cloudy, 31\u00B0C")).toBeInTheDocument()
  })

  it("renders only temperature when condition is null", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          weatherCondition: null,
          weatherTemperature: 28,
        })}
      />
    )

    expect(screen.getByText("28\u00B0C")).toBeInTheDocument()
  })

  it("renders only condition when temperature is null", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          weatherCondition: "Clear",
          weatherTemperature: null,
        })}
      />
    )

    expect(screen.getByText("Clear")).toBeInTheDocument()
  })

  it("does not render weather when both are null", () => {
    const { container } = render(
      <ChapterCard
        chapter={makeChapter({
          weatherCondition: null,
          weatherTemperature: null,
        })}
      />
    )

    // Should have no weather paragraph — only location detail, date, and heading
    const paragraphs = container.querySelectorAll("p")
    const texts = Array.from(paragraphs).map((p) => p.textContent)
    expect(texts).not.toContain(expect.stringContaining("\u00B0C"))
  })

  it("renders description when present", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          description: "Arrived in Bangkok late at night.",
        })}
      />
    )

    expect(
      screen.getByText("Arrived in Bangkok late at night.")
    ).toBeInTheDocument()
  })

  it("does not render description when null", () => {
    render(<ChapterCard chapter={makeChapter({ description: null })} />)

    // Should only have the heading + location + date paragraphs
    expect(
      screen.queryByText("Arrived in Bangkok late at night.")
    ).not.toBeInTheDocument()
  })

  it("preserves line breaks in description via whitespace-pre-line", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          description: "Line one\nLine two\nLine three",
        })}
      />
    )

    const desc = screen.getByText(/Line one/)
    // The whitespace-pre-line class is on the <p> element, which is the parent of <bdi>
    const paragraph = desc.closest("p")
    expect(paragraph).toHaveClass("whitespace-pre-line")
  })

  it("wraps the display name in bdi for bidirectional text", () => {
    render(
      <ChapterCard
        chapter={makeChapter({ displayName: "\u05D1\u05E0\u05D2\u05E7\u05D5\u05E7" })}
      />
    )

    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toHaveAttribute("dir", "auto")
    const bdi = heading.querySelector("bdi")
    expect(bdi).toBeInTheDocument()
  })

  it("rounds temperature to integer", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          weatherCondition: "Sunny",
          weatherTemperature: 30.7,
        })}
      />
    )

    expect(screen.getByText("Sunny, 31\u00B0C")).toBeInTheDocument()
  })

  it("does not render location detail when it is empty", () => {
    render(
      <ChapterCard
        chapter={makeChapter({
          location: {
            name: "Bangkok",
            detail: "",
            fullDetail: "",
            countryCode: "TH",
            lat: 13.7,
            lon: 100.5,
          },
        })}
      />
    )

    // Only heading, date should be present (no location detail paragraph)
    const paragraphs = screen.getAllByText(/.+/)
    expect(paragraphs.find((el) => el.textContent === "Bangkok, Thailand")).toBeUndefined()
  })
})
