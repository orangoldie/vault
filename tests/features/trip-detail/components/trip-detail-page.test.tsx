import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { Trip, Chapter } from "@/types/trip"

// Mock dependencies
vi.mock("@/stores/db", () => ({
  getTripBySlug: vi.fn(),
  getChaptersByTrip: vi.fn(),
  getPhotosByChapter: vi.fn().mockResolvedValue([]),
  getPhotoCountsByTrip: vi.fn().mockResolvedValue(new Map()),
}))

vi.mock("@/stores/photo-storage", () => ({
  readPhoto: vi.fn(),
}))

// Mock framer-motion to render plain elements
vi.mock("framer-motion", () => {
  // Strip motion-specific props and render the base HTML element
  function makeElement(Tag: string) {
    return ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const htmlProps: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(props)) {
        // Skip framer-motion-only props
        if (
          ["initial", "animate", "exit", "transition", "variants",
           "whileHover", "whileInView", "whileTap", "layoutId",
           "onAnimationComplete"].includes(k)
        ) continue
        htmlProps[k] = v
      }
      if (Tag === "button" && !htmlProps.type) htmlProps.type = "button"
      // @ts-expect-error dynamic element
      return <Tag {...htmlProps}>{children}</Tag>
    }
  }

  return {
    motion: {
      div: makeElement("div"),
      img: makeElement("img"),
      button: makeElement("button"),
      p: makeElement("p"),
      path: makeElement("path"),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useReducedMotion: () => false,
    useInView: () => true,
  }
})

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

import { getTripBySlug, getChaptersByTrip } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"
import { TripDetailPage } from "@/features/trip-detail/components/trip-detail-page"

const mockGetTripBySlug = vi.mocked(getTripBySlug)
const mockGetChaptersByTrip = vi.mocked(getChaptersByTrip)
const mockReadPhoto = vi.mocked(readPhoto)

function makeTripFixture(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 1,
    name: "Test Trip",
    slug: "test-trip",
    startDate: 1739059200,
    endDate: 1749513600,
    summary: "A wonderful journey",
    coverPhotoId: null,
    chapterCount: 2,
    photoCount: 10,
    totalKm: 5000,
    uuid: "uuid-trip-1",
    importedAt: Date.now(),
    ...overrides,
  }
}

function makeChapterFixture(overrides: Partial<Chapter> = {}): Chapter {
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
    weatherCondition: "Sunny",
    weatherTemperature: 31,
    uuid: "uuid-chapter-100",
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("TripDetailPage", () => {
  it("shows loading skeleton initially", () => {
    // Make the DB call hang (never resolve)
    mockGetTripBySlug.mockReturnValue(new Promise(() => {}))

    render(<TripDetailPage slug="test-trip" />)

    // The skeleton should be present during loading
    // The skeleton renders shimmer blocks — check for its presence via aria-live container
    const container = document.querySelector("[aria-live]")
    expect(container).toBeInTheDocument()
  })

  it("renders the success state with trip header and chapters", async () => {
    const trip = makeTripFixture()
    const chapters = [
      makeChapterFixture({ id: 1, displayName: "Bangkok" }),
      makeChapterFixture({ id: 2, displayName: "Chiang Mai", startTime: 1739491200 }),
    ]

    mockGetTripBySlug.mockResolvedValue(trip)
    mockGetChaptersByTrip.mockResolvedValue(chapters)

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(screen.getByText("Test Trip")).toBeInTheDocument()
    })

    expect(screen.getByText("A wonderful journey")).toBeInTheDocument()
    // Chapter names appear in both the nav and the section
    expect(screen.getAllByText("Bangkok").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Chiang Mai").length).toBeGreaterThanOrEqual(1)
  })

  it("renders the not-found state when slug does not match", async () => {
    mockGetTripBySlug.mockResolvedValue(undefined)

    render(<TripDetailPage slug="nonexistent" />)

    await waitFor(() => {
      expect(screen.getByText("Trip not found")).toBeInTheDocument()
    })

    expect(
      screen.getByText(/doesn.t exist or may have been removed/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to your trips/i })
    ).toHaveAttribute("href", "/import")
  })

  it("renders the error state when DB read fails", async () => {
    mockGetTripBySlug.mockRejectedValue(new Error("DB failure"))

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    expect(
      screen.getByText(/couldn.t load this trip/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Try Again/i })
    ).toBeInTheDocument()
  })

  it("retries loading when Try Again is clicked", async () => {
    // First call fails, second succeeds
    mockGetTripBySlug
      .mockRejectedValueOnce(new Error("DB failure"))
      .mockResolvedValueOnce(makeTripFixture())
    mockGetChaptersByTrip.mockResolvedValue([makeChapterFixture()])

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /Try Again/i }))

    await waitFor(() => {
      expect(screen.getByText("Test Trip")).toBeInTheDocument()
    })
  })

  it("renders trip name as h1 in header when no cover photo", async () => {
    mockGetTripBySlug.mockResolvedValue(makeTripFixture({ coverPhotoId: null }))
    mockGetChaptersByTrip.mockResolvedValue([makeChapterFixture()])

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      const heading = screen.getByRole("heading", { level: 1 })
      expect(heading).toHaveTextContent("Test Trip")
    })
  })

  it("shows the empty chapters message when trip has no chapters", async () => {
    mockGetTripBySlug.mockResolvedValue(makeTripFixture())
    mockGetChaptersByTrip.mockResolvedValue([])

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(
        screen.getByText("No chapters recorded for this trip.")
      ).toBeInTheDocument()
    })
  })

  it("has an aria-live region for state announcements", () => {
    mockGetTripBySlug.mockReturnValue(new Promise(() => {}))
    render(<TripDetailPage slug="test-trip" />)

    const container = document.querySelector("[aria-live]")
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute("aria-live", "polite")
  })

  it("renders a skip-to-content link", () => {
    mockGetTripBySlug.mockReturnValue(new Promise(() => {}))
    render(<TripDetailPage slug="test-trip" />)

    const skipLink = screen.getByText("Skip to content")
    expect(skipLink).toBeInTheDocument()
    expect(skipLink).toHaveAttribute("href", "#trip-header")
  })

  it("renders trip stats in success state", async () => {
    mockGetTripBySlug.mockResolvedValue(
      makeTripFixture({ chapterCount: 5, photoCount: 42, totalKm: 1234 })
    )
    mockGetChaptersByTrip.mockResolvedValue([makeChapterFixture()])

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(screen.getByText("5 chapters")).toBeInTheDocument()
      expect(screen.getByText("42 photos")).toBeInTheDocument()
      expect(screen.getByText("1,234 km")).toBeInTheDocument()
    })
  })

  it("renders without cover photo when readPhoto fails", async () => {
    mockGetTripBySlug.mockResolvedValue(
      makeTripFixture({ coverPhotoId: "1-100-photo.jpg" })
    )
    mockGetChaptersByTrip.mockResolvedValue([makeChapterFixture()])
    mockReadPhoto.mockRejectedValue(new Error("OPFS read failure"))

    render(<TripDetailPage slug="test-trip" />)

    await waitFor(() => {
      expect(screen.getByText("Test Trip")).toBeInTheDocument()
    })

    // Trip should still render despite cover photo failure
    expect(screen.getByText("A wonderful journey")).toBeInTheDocument()
    // No cover image should appear
    expect(screen.queryByAltText("Cover photo for Test Trip")).not.toBeInTheDocument()
  })
})
