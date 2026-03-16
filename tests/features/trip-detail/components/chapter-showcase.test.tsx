import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import type { Chapter } from "@/types/trip"

// Mock db and photo-storage before importing component
vi.mock("@/stores/db", () => ({
  getPhotosByChapter: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/stores/photo-storage", () => ({
  readPhoto: vi.fn(),
}))

// Mock framer-motion
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion")

  function makeElement(Tag: string) {
    return ({
      children,
      className,
      onClick,
      style,
      dir,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const props: Record<string, unknown> = {}
      if (className) props.className = className
      if (onClick) props.onClick = onClick
      if (style) props.style = style
      if (dir) props.dir = dir
      if (rest.role) props.role = rest.role
      if (rest["aria-label"]) props["aria-label"] = rest["aria-label"]
      if (rest["aria-roledescription"]) props["aria-roledescription"] = rest["aria-roledescription"]
      if (rest["aria-hidden"]) props["aria-hidden"] = rest["aria-hidden"]
      if (rest.tabIndex != null) props.tabIndex = rest.tabIndex
      if (Tag === "button") props.type = "button"
      // @ts-expect-error dynamic element
      return <Tag {...props}>{children}</Tag>
    }
  }

  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
    useInView: () => true,
    motion: {
      div: makeElement("div"),
      button: makeElement("button"),
      p: makeElement("p"),
      path: makeElement("path"),
    },
  }
})

import { ChapterShowcase } from "@/features/trip-detail/components/chapter-showcase"

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: 100,
    tripId: 1,
    displayName: "Bangkok",
    description: "Arrived in Bangkok",
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

describe("ChapterShowcase", () => {
  it("renders empty message when no chapters provided", () => {
    render(<ChapterShowcase chapters={[]} photoCountsByChapter={new Map()} />)

    expect(
      screen.getByText("No chapters recorded for this trip.")
    ).toBeInTheDocument()
  })

  it("renders chapter sections for each chapter", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Tokyo" }),
      makeChapter({ id: 2, displayName: "Kyoto" }),
    ]

    render(<ChapterShowcase chapters={chapters} photoCountsByChapter={new Map()} />)

    expect(
      screen.getByRole("region", { name: "Chapter: Tokyo" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("region", { name: "Chapter: Kyoto" })
    ).toBeInTheDocument()
  })

  it("renders the sidebar nav on desktop", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Tokyo" }),
      makeChapter({ id: 2, displayName: "Kyoto" }),
    ]

    render(<ChapterShowcase chapters={chapters} photoCountsByChapter={new Map()} />)

    expect(
      screen.getByRole("navigation", { name: "Chapter navigation" })
    ).toBeInTheDocument()
  })

  it("renders the pill nav for mobile/tablet", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Tokyo" }),
      makeChapter({ id: 2, displayName: "Kyoto" }),
    ]

    render(<ChapterShowcase chapters={chapters} photoCountsByChapter={new Map()} />)

    // The pill button should exist
    expect(
      screen.getByRole("button", { name: "Chapter navigation" })
    ).toBeInTheDocument()
  })

  it("renders sentinel divs for intersection observer", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Tokyo" }),
      makeChapter({ id: 2, displayName: "Kyoto" }),
    ]

    const { container } = render(<ChapterShowcase chapters={chapters} photoCountsByChapter={new Map()} />)

    const sentinels = container.querySelectorAll("[data-chapter-sentinel]")
    expect(sentinels).toHaveLength(2)
    expect(sentinels[0]).toHaveAttribute("data-chapter-id", "1")
    expect(sentinels[1]).toHaveAttribute("data-chapter-id", "2")
  })

  it("renders chapter descriptions", () => {
    const chapters = [
      makeChapter({ id: 1, displayName: "Tokyo", description: "Cherry blossoms everywhere" }),
    ]

    render(<ChapterShowcase chapters={chapters} photoCountsByChapter={new Map()} />)

    expect(screen.getByText("Cherry blossoms everywhere")).toBeInTheDocument()
  })
})
