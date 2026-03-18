import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { Chapter } from "@/types/trip"

// Mock maplibre-gl (WebGL not available in jsdom)
vi.mock("maplibre-gl", () => ({
  default: {
    addProtocol: vi.fn(),
    removeProtocol: vi.fn(),
  },
}))

// Mock pmtiles
vi.mock("pmtiles", () => {
  return {
    Protocol: class {
      tile = vi.fn()
    },
  }
})

// Mock react-maplibre
vi.mock("@vis.gl/react-maplibre", () => ({
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="maplibre-map">{children}</div>
  ),
  Marker: ({
    children,
  }: {
    children?: React.ReactNode
    longitude: number
    latitude: number
  }) => <div data-testid="maplibre-marker">{children}</div>,
  Source: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="maplibre-source">{children}</div>
  ),
  Layer: () => <div data-testid="maplibre-layer" />,
}))

// Mock maplibre CSS import
vi.mock("maplibre-gl/dist/maplibre-gl.css", () => ({}))

// Mock globe style
vi.mock("@/features/trip-detail/lib/globe-style", () => ({
  createGlobeStyle: () => ({ version: 8, sources: {}, layers: [] }),
}))

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <div
        className={className as string}
        role={rest.role as string}
        aria-label={rest["aria-label"] as string}
        tabIndex={rest.tabIndex as number}
        onClick={rest.onClick as React.MouseEventHandler}
        onKeyDown={rest.onKeyDown as React.KeyboardEventHandler}
      >
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      onClick,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <button
        className={className as string}
        onClick={onClick as React.MouseEventHandler}
        type="button"
        aria-label={rest["aria-label"] as string}
      >
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

import { TripGlobe } from "@/features/trip-detail/components/trip-globe"

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

const defaultChapters = [
  makeChapter({ id: 1, displayName: "Bangkok" }),
  makeChapter({
    id: 2,
    displayName: "Chiang Mai",
    slug: "chiang-mai",
    location: {
      name: "Chiang Mai",
      detail: "Chiang Mai, Thailand",
      fullDetail: "Chiang Mai, Thailand",
      countryCode: "TH",
      lat: 18.8,
      lon: 98.9,
    },
  }),
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe("TripGlobe", () => {
  it("renders globe controls when visible", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const buttons = screen.getAllByLabelText("View trip on globe")
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it("does not render when visible is false", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={false}
        onNavigate={vi.fn()}
      />
    )

    // Desktop globe is visually hidden (opacity-0, pointer-events-none)
    const expandButton = screen.getByText("Click to expand")
    expect(expandButton.closest("[class*='opacity-0']")).toBeTruthy()

    // Mobile FAB is removed from the DOM when not visible
    const allGlobeButtons = screen.queryAllByLabelText("View trip on globe")
    // Only the desktop button remains (always mounted); mobile FAB is gone
    expect(allGlobeButtons).toHaveLength(1)
  })

  it("renders the compass rose SVG with cardinal labels", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    expect(screen.getByText("N")).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
    expect(screen.getByText("E")).toBeInTheDocument()
    expect(screen.getByText("W")).toBeInTheDocument()
  })

  it("opens the expanded overlay when FAB is clicked", async () => {
    const user = userEvent.setup()

    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const buttons = screen.getAllByLabelText("View trip on globe")
    await user.click(buttons[buttons.length - 1])

    expect(
      screen.getByRole("button", { name: "Close globe view" })
    ).toBeInTheDocument()
  })

  it("shows chapter list in expanded overlay", async () => {
    const user = userEvent.setup()

    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const buttons = screen.getAllByLabelText("View trip on globe")
    await user.click(buttons[buttons.length - 1])

    expect(
      screen.getByRole("dialog", { name: "Trip globe view" })
    ).toBeInTheDocument()
  })

  it("closes the overlay when close button is clicked", async () => {
    const user = userEvent.setup()

    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const buttons = screen.getAllByLabelText("View trip on globe")
    await user.click(buttons[buttons.length - 1])

    const closeButton = screen.getByRole("button", {
      name: "Close globe view",
    })
    await user.click(closeButton)

    expect(
      screen.queryByRole("button", { name: "Close globe view" })
    ).not.toBeInTheDocument()
  })

  it("renders expand hint text on desktop globe", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    expect(screen.getByText("Click to expand")).toBeInTheDocument()
  })

  it("renders chapter markers on the map", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const markers = screen.getAllByTestId("maplibre-marker")
    expect(markers.length).toBe(defaultChapters.length)
  })

  it("renders the mobile FAB button", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const buttons = screen.getAllByLabelText("View trip on globe")
    // Should have both desktop (div role=button) and mobile (button)
    expect(buttons.length).toBe(2)
  })

  it("opens overlay from mobile FAB", async () => {
    const user = userEvent.setup()

    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    // The mobile FAB is the last button with the label
    const buttons = screen.getAllByLabelText("View trip on globe")
    const mobileFab = buttons[buttons.length - 1]
    await user.click(mobileFab)

    expect(
      screen.getByRole("dialog", { name: "Trip globe view" })
    ).toBeInTheDocument()
  })

  it("renders OpenStreetMap attribution on the mini globe", () => {
    render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    expect(screen.getByText("OpenStreetMap")).toBeInTheDocument()
  })

  it("applies pulse-glow animation to active chapter marker", () => {
    const { container } = render(
      <TripGlobe
        chapters={defaultChapters}
        activeIndex={0}
        visible={true}
        onNavigate={vi.fn()}
      />
    )

    const activeMarker = container.querySelector("[class*='pulse-glow']")
    expect(activeMarker).toBeTruthy()
  })
})
