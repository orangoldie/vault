import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { Chapter } from "@/types/trip"

// Mock maplibre-gl
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
        onClick={rest.onClick as React.MouseEventHandler}
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

import { GlobeOverlay } from "@/features/trip-detail/components/globe-overlay"

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

const chapters = [
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
  makeChapter({
    id: 3,
    displayName: "Phuket",
    slug: "phuket",
    location: {
      name: "Phuket",
      detail: "Phuket, Thailand",
      fullDetail: "Phuket, Thailand",
      countryCode: "TH",
      lat: 7.9,
      lon: 98.4,
    },
  }),
]

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  document.documentElement.style.overflow = ""
})

describe("GlobeOverlay", () => {
  it("renders as a dialog with correct aria-label", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByRole("dialog", { name: "Trip globe view" })
    ).toBeInTheDocument()
  })

  it("renders a close button", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: "Close globe view" })
    ).toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={onClose}
      />
    )

    await user.click(screen.getByRole("button", { name: "Close globe view" }))

    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={onClose}
      />
    )

    await user.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalled()
  })

  it("renders chapter list with all chapter names", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Names appear in both sidebar and map markers
    expect(screen.getAllByText("Bangkok").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Chiang Mai").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Phuket").length).toBeGreaterThanOrEqual(1)
  })

  it("highlights the active chapter in the sidebar by default", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={1}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // The sidebar button for Chiang Mai (activeIndex=1) should be highlighted
    const buttons = screen.getAllByText("Chiang Mai")
    const sidebarButton = buttons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.className.includes("bg-vault-gold/20"))
    expect(sidebarButton).toBeTruthy()
  })

  it("does not show 'Go to chapter' button before selecting a pin", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText("Go to chapter")).not.toBeInTheDocument()
  })

  it("shows popover and sidebar action when a pin is clicked", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Click the Chiang Mai pin on the map
    const pinButton = screen.getByLabelText("Select Chiang Mai")
    await user.click(pinButton)

    // Popover "Go" button should appear on the map
    expect(
      screen.getByRole("button", { name: "Go to Chiang Mai" })
    ).toBeInTheDocument()

    // Sidebar "Go to chapter" action should appear
    expect(screen.getByText("Go to chapter")).toBeInTheDocument()
  })

  it("highlights the selected chapter instead of the active one", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Initially Bangkok (index 0) is highlighted
    const bangkokButtons = screen.getAllByText("Bangkok")
    const bangkokSidebar = bangkokButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.className.includes("bg-vault-gold/20"))
    expect(bangkokSidebar).toBeTruthy()

    // Click Phuket pin
    await user.click(screen.getByLabelText("Select Phuket"))

    // Now Phuket should be highlighted in the sidebar
    const phuketButtons = screen.getAllByText("Phuket")
    const phuketSidebar = phuketButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.className.includes("bg-vault-gold/20"))
    expect(phuketSidebar).toBeTruthy()
  })

  it("deselects pin when clicking the same pin again", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const pinButton = screen.getByLabelText("Select Chiang Mai")

    // Select
    await user.click(pinButton)
    expect(screen.getByText("Go to chapter")).toBeInTheDocument()

    // Deselect
    await user.click(pinButton)
    expect(screen.queryByText("Go to chapter")).not.toBeInTheDocument()
  })

  it("selects chapter when clicking sidebar entry", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Find the sidebar button for Phuket (it's in a button with the text)
    const sidebarButtons = screen.getAllByText("Phuket")
    // The sidebar button is the one that's a direct child button (not the map marker one)
    const sidebarBtn = sidebarButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.className.includes("text-left"))
    expect(sidebarBtn).toBeTruthy()

    await user.click(sidebarBtn!)

    // Should show the go-to action in the sidebar
    expect(screen.getByText("Go to chapter")).toBeInTheDocument()

    // Should show the popover on the map
    expect(
      screen.getByRole("button", { name: "Go to Phuket" })
    ).toBeInTheDocument()
  })

  it("navigates when 'Go' popover button is clicked", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    )

    // Select Chiang Mai
    await user.click(screen.getByLabelText("Select Chiang Mai"))

    // Click the Go button in the popover
    await user.click(screen.getByRole("button", { name: "Go to Chiang Mai" }))

    expect(onClose).toHaveBeenCalled()
  })

  it("navigates when sidebar 'Go to chapter' is clicked", async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={onNavigate}
        onClose={onClose}
      />
    )

    // Select Phuket via sidebar
    const sidebarButtons = screen.getAllByText("Phuket")
    const sidebarBtn = sidebarButtons
      .map((el) => el.closest("button"))
      .find((btn) => btn?.className.includes("text-left"))
    await user.click(sidebarBtn!)

    // Click "Go to chapter"
    await user.click(screen.getByText("Go to chapter"))

    expect(onClose).toHaveBeenCalled()
  })

  it("closes overlay when clicking backdrop", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={onClose}
      />
    )

    const dialog = screen.getByRole("dialog")
    await user.click(dialog)

    expect(onClose).toHaveBeenCalled()
  })

  it("closes overlay when clicking backdrop even with pin selected", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={onClose}
      />
    )

    // Select a pin first
    await user.click(screen.getByLabelText("Select Chiang Mai"))
    expect(screen.getByText("Go to chapter")).toBeInTheDocument()

    // Click the backdrop — should close directly
    const dialog = screen.getByRole("dialog")
    await user.click(dialog)

    expect(onClose).toHaveBeenCalled()
  })

  it("locks body scroll on mount and restores on unmount", () => {
    const { unmount } = render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(document.documentElement.style.overflow).toBe("hidden")

    unmount()

    expect(document.documentElement.style.overflow).toBe("")
  })

  it("renders the Chapters heading", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("Chapters")).toBeInTheDocument()
  })

  it("renders chapter markers on the map", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const markers = screen.getAllByTestId("maplibre-marker")
    expect(markers.length).toBe(chapters.length)
  })

  it("renders teardrop SVG pins for markers", () => {
    const { container } = render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    const svgs = container.querySelectorAll("[data-testid='maplibre-marker'] svg")
    expect(svgs.length).toBe(chapters.length)
  })

  it("renders OpenStreetMap attribution", () => {
    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("OpenStreetMap")).toBeInTheDocument()
  })

  it("shows popover with Go button above selected pin", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByLabelText("Select Phuket"))

    // Popover should show chapter name and Go button
    const goButton = screen.getByRole("button", { name: "Go to Phuket" })
    expect(goButton).toBeInTheDocument()
    expect(goButton.textContent).toContain("Go")
  })

  it("switching selection between pins updates popover", async () => {
    const user = userEvent.setup()

    render(
      <GlobeOverlay
        chapters={chapters}
        activeIndex={0}
        onNavigate={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Select Chiang Mai
    await user.click(screen.getByLabelText("Select Chiang Mai"))
    expect(screen.getByRole("button", { name: "Go to Chiang Mai" })).toBeInTheDocument()

    // Switch to Phuket
    await user.click(screen.getByLabelText("Select Phuket"))
    expect(screen.queryByRole("button", { name: "Go to Chiang Mai" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to Phuket" })).toBeInTheDocument()
  })
})
