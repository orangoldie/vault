import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ChapterNavSidebar } from "@/features/trip-detail/components/chapter-nav-sidebar"
import type { Chapter } from "@/types/trip"

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

const chapters = [
  makeChapter({ id: 1, displayName: "Tokyo" }),
  makeChapter({ id: 2, displayName: "Kyoto" }),
  makeChapter({ id: 3, displayName: "Bangkok" }),
]

describe("ChapterNavSidebar", () => {
  it("renders a nav with accessible label", () => {
    render(
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    expect(
      screen.getByRole("navigation", { name: "Chapter navigation" })
    ).toBeInTheDocument()
  })

  it("renders all chapter names", () => {
    render(
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    expect(screen.getByText("Tokyo")).toBeInTheDocument()
    expect(screen.getByText("Kyoto")).toBeInTheDocument()
    expect(screen.getByText("Bangkok")).toBeInTheDocument()
  })

  it("truncates long chapter names", () => {
    const longChapters = [
      makeChapter({
        id: 1,
        displayName: "This is a very long chapter name that should be truncated",
      }),
    ]

    render(
      <ChapterNavSidebar
        chapters={longChapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    // 20 chars + ellipsis: "This is a very long " = 20 chars
    expect(screen.getByText("This is a very long …")).toBeInTheDocument()
  })

  it("calls onNavigate when a chapter is clicked", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    render(
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={onNavigate}
      />
    )

    await user.click(screen.getByText("Bangkok"))
    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it("marks the active chapter dot with aria-current", () => {
    render(
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={1}
        visible={true}
        onNavigate={() => {}}
      />
    )

    const activeButton = screen.getByRole("button", { name: "Go to Kyoto" })
    expect(activeButton).toHaveAttribute("aria-current", "true")
  })

  it("is hidden when not visible", () => {
    render(
      <ChapterNavSidebar
        chapters={chapters}
        activeIndex={0}
        visible={false}
        onNavigate={() => {}}
      />
    )

    const nav = screen.getByRole("navigation", { name: "Chapter navigation" })
    expect(nav).toHaveClass("opacity-0")
    expect(nav).toHaveClass("pointer-events-none")
  })
})
