import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import type { Trip, Chapter } from "@/types/trip"

// Mock framer-motion
vi.mock("framer-motion", () => {
  function stripMotionProps(props: Record<string, unknown>) {
    const motionKeys = [
      "initial", "animate", "exit", "transition", "variants",
      "whileHover", "whileInView", "whileTap", "custom",
    ]
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!motionKeys.includes(k)) cleaned[k] = v
    }
    return cleaned
  }

  const makeElement = (tag: string) => {
    return (props: Record<string, unknown>) => {
      const { children, ...rest } = stripMotionProps(props)
      const Tag = tag as keyof JSX.IntrinsicElements
      return <Tag {...rest}>{children as React.ReactNode}</Tag>
    }
  }

  return {
    motion: {
      div: makeElement("div"),
      span: makeElement("span"),
      button: makeElement("button"),
    },
    useInView: () => true,
  }
})

// Mock tooltip
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Calendar: (props: Record<string, unknown>) => <span data-testid="icon-calendar" {...props} />,
  Route: (props: Record<string, unknown>) => <span data-testid="icon-route" {...props} />,
  Camera: (props: Record<string, unknown>) => <span data-testid="icon-camera" {...props} />,
  ChevronsDown: (props: Record<string, unknown>) => <span data-testid="icon-chevrons-down" {...props} />,
}))

// Mock country-flag
vi.mock("@/lib/country-flag", () => ({
  countryFlagClass: (code: string) => `fi fi-${code.toLowerCase()} fis`,
}))

import { TripSummary } from "@/features/trip-detail/components/trip-summary"

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 1,
    name: "Southeast Asia",
    slug: "southeast-asia",
    startDate: 1704412800, // Jan 5, 2024
    endDate: 1710460800, // Mar 15, 2024
    summary: "An amazing journey through Southeast Asia.",
    coverPhotoId: "cover-123",
    chapterCount: 5,
    photoCount: 42,
    totalKm: 1234,
    uuid: "test-uuid",
    importedAt: 1710460800,
    ...overrides,
  }
}

function makeChapter(countryCode: string, id = Math.random()): Chapter {
  return {
    id,
    tripId: 1,
    displayName: "Test Chapter",
    description: null,
    slug: "test",
    startTime: 0,
    endTime: null,
    location: {
      name: "Test",
      detail: "",
      fullDetail: "",
      countryCode,
      lat: 0,
      lon: 0,
    },
    weatherCondition: null,
    weatherTemperature: null,
    uuid: "ch-test",
  }
}

describe("TripSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"))
  })

  it("renders the trip name when hasCover is false", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={false} prefersReducedMotion={true} />
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Southeast Asia")
  })

  it("does not render the trip name when hasCover is true", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("renders the editorial date range", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByText("January – March 2024")).toBeInTheDocument()
  })

  it("renders the time-ago hint for older trips", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    // Trip ended March 2024, "now" is March 2026 → ~2 years ago
    expect(screen.getByText(/year/)).toBeInTheDocument()
  })

  it("does not render time-ago hint for recent trips", () => {
    vi.setSystemTime(new Date("2024-05-01T12:00:00Z"))
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument()
  })

  it("renders all three stats when data is present", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByRole("listitem", { name: /days/ })).toBeInTheDocument()
    expect(screen.getByRole("listitem", { name: "1,234 km" })).toBeInTheDocument()
    expect(screen.getByRole("listitem", { name: "42 photos" })).toBeInTheDocument()
  })

  it("hides distance stat when totalKm is 0", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary
        trip={makeTrip({ totalKm: 0 })}
        chapters={chapters}
        hasCover={true}
        prefersReducedMotion={true}
      />
    )
    expect(screen.queryByRole("listitem", { name: /km/ })).not.toBeInTheDocument()
    expect(screen.getByRole("listitem", { name: /days/ })).toBeInTheDocument()
  })

  it("hides photos stat when photoCount is 0", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary
        trip={makeTrip({ photoCount: 0 })}
        chapters={chapters}
        hasCover={true}
        prefersReducedMotion={true}
      />
    )
    expect(screen.queryByRole("listitem", { name: /photo/ })).not.toBeInTheDocument()
  })

  it("renders summary text when present", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByText("An amazing journey through Southeast Asia.")).toBeInTheDocument()
  })

  it("does not render summary text when empty", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary
        trip={makeTrip({ summary: "  " })}
        chapters={chapters}
        hasCover={true}
        prefersReducedMotion={true}
      />
    )
    expect(screen.queryByText(/journey/)).not.toBeInTheDocument()
  })

  it("renders chapter anchor with correct count", () => {
    const chapters = [makeChapter("TH", 1), makeChapter("VN", 2), makeChapter("LA", 3)]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    const button = screen.getByRole("button", { name: /chapter/ })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent("3 chapters")
  })

  it("uses singular form for single chapter", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByRole("button")).toHaveTextContent("1 chapter")
  })

  it("hides country route when all chapters lack country codes", () => {
    const chapters = [makeChapter(""), makeChapter("")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.queryByLabelText(/Route:/)).not.toBeInTheDocument()
  })

  it("renders the section with aria-label", () => {
    const chapters = [makeChapter("TH")]
    render(
      <TripSummary trip={makeTrip()} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByLabelText("Trip summary")).toBeInTheDocument()
  })

  it("uses singular labels when values are 1", () => {
    const chapters = [makeChapter("TH")]
    // Same-day trip: startDate = endDate (in terms of calendar days)
    const trip = makeTrip({
      startDate: 1704412800,
      endDate: 1704412800,
      totalKm: 1,
      photoCount: 1,
    })
    render(
      <TripSummary trip={trip} chapters={chapters} hasCover={true} prefersReducedMotion={true} />
    )
    expect(screen.getByRole("listitem", { name: "1 day" })).toBeInTheDocument()
    expect(screen.getByRole("listitem", { name: "1 km" })).toBeInTheDocument()
    expect(screen.getByRole("listitem", { name: "1 photo" })).toBeInTheDocument()
  })
})
