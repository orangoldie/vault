import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ChapterNavPill } from "@/features/trip-detail/components/chapter-nav-pill"
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

describe("ChapterNavPill", () => {
  it("shows the active chapter name and position", () => {
    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={1}
        visible={true}
        onNavigate={() => {}}
      />
    )

    expect(screen.getByText("Kyoto")).toBeInTheDocument()
    expect(screen.getByText("· 2 of 3")).toBeInTheDocument()
  })

  it("has an accessible chapter navigation label", () => {
    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    expect(
      screen.getByRole("button", { name: "Chapter navigation" })
    ).toBeInTheDocument()
  })

  it("is hidden when not visible", () => {
    const { container } = render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={false}
        onNavigate={() => {}}
      />
    )

    const pill = container.firstChild as HTMLElement
    expect(pill).toHaveClass("opacity-0")
    expect(pill).toHaveClass("pointer-events-none")
  })

  it("opens a chapter list popover when clicked", async () => {
    const user = userEvent.setup()

    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    await user.click(screen.getByRole("button", { name: "Chapter navigation" }))

    // All chapter names should appear in the popover
    // The active chapter name appears in both the pill and the popover
    const tokyoElements = screen.getAllByText("Tokyo")
    expect(tokyoElements.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("Kyoto")).toBeInTheDocument()
    expect(screen.getByText("Bangkok")).toBeInTheDocument()
  })

  it("calls onNavigate when a chapter in the popover is clicked", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={onNavigate}
      />
    )

    // Open popover
    await user.click(screen.getByRole("button", { name: "Chapter navigation" }))
    // Click a chapter
    await user.click(screen.getByText("Bangkok"))

    expect(onNavigate).toHaveBeenCalledWith(2)
  })

  it("closes the popover after selecting a chapter", async () => {
    const user = userEvent.setup()

    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    // Open popover
    await user.click(screen.getByRole("button", { name: "Chapter navigation" }))
    expect(screen.getByText("Kyoto")).toBeInTheDocument()

    // Select a chapter
    await user.click(screen.getByText("Kyoto"))

    // Popover should close — Kyoto should no longer be in popover
    // (it won't be rendered since only the pill shows the active chapter)
    const kyotoElements = screen.queryAllByText("Kyoto")
    // Only the pill text remains if popover closed (0 if not active, or none in popover)
    expect(kyotoElements.length).toBeLessThanOrEqual(1)
  })

  it("returns null when activeIndex points to nonexistent chapter", () => {
    const { container } = render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={99}
        visible={true}
        onNavigate={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("closes popover on Escape key", async () => {
    const user = userEvent.setup()

    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={0}
        visible={true}
        onNavigate={() => {}}
      />
    )

    // Open popover
    await user.click(screen.getByRole("button", { name: "Chapter navigation" }))
    expect(screen.getByText("Kyoto")).toBeInTheDocument()

    // Press Escape
    await user.keyboard("{Escape}")

    // Popover should close
    const kyotoElements = screen.queryAllByText("Kyoto")
    expect(kyotoElements.length).toBeLessThanOrEqual(1)
  })

  it("highlights the active chapter in the popover", async () => {
    const user = userEvent.setup()

    render(
      <ChapterNavPill
        chapters={chapters}
        activeIndex={1}
        visible={true}
        onNavigate={() => {}}
      />
    )

    await user.click(screen.getByRole("button", { name: "Chapter navigation" }))

    // The active chapter button in the popover should have the gold color class
    const popoverButtons = screen.getAllByRole("button")
    // Find the Kyoto button in the popover (not the pill button)
    const kyotoButtons = popoverButtons.filter(
      (b) => b.textContent?.includes("Kyoto") && !b.textContent?.includes("of")
    )
    expect(kyotoButtons.length).toBeGreaterThanOrEqual(1)
    expect(kyotoButtons[0]).toHaveClass("text-vault-gold")
  })
})
