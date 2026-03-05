import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TripSelectionList } from "@/features/import/components/trip-selection-list"
import type { TripSummary } from "@/types/import"

const trips: TripSummary[] = [
  {
    id: 1,
    name: "Summer in Japan",
    startDate: 1718208000,
    endDate: 1720022400,
    chapterCount: 8,
    tripDirPath: "trip/japan_1/",
    alreadyImported: false,
  },
  {
    id: 2,
    name: "Weekend in Paris",
    startDate: 1709856000,
    endDate: 1710028800,
    chapterCount: 3,
    tripDirPath: "trip/paris_2/",
    alreadyImported: true,
  },
  {
    id: 3,
    name: "Road Trip California",
    startDate: 1690848000,
    endDate: 1692316800,
    chapterCount: 12,
    tripDirPath: "trip/cali_3/",
    alreadyImported: false,
  },
]

let onSelectTrip: ReturnType<typeof vi.fn<(trip: TripSummary) => void>>
let onDismiss: ReturnType<typeof vi.fn<() => void>>

beforeEach(() => {
  onSelectTrip = vi.fn<(trip: TripSummary) => void>()
  onDismiss = vi.fn<() => void>()
})

describe("TripSelectionList", () => {
  it("renders all trips as cards with correct info", () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    expect(screen.getByText("Summer in Japan")).toBeInTheDocument()
    expect(screen.getByText("Weekend in Paris")).toBeInTheDocument()
    expect(screen.getByText("Road Trip California")).toBeInTheDocument()
    expect(screen.getByText("8 chapters")).toBeInTheDocument()
    expect(screen.getByText("3 chapters")).toBeInTheDocument()
    expect(screen.getByText("12 chapters")).toBeInTheDocument()
  })

  it("shows 'Already imported' badge for matching trips", () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    expect(screen.getByText("Already imported")).toBeInTheDocument()
  })

  it("calls onSelectTrip when tapping a non-imported card", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const japanCard = screen.getByRole("button", { name: /Summer in Japan/i })
    await userEvent.click(japanCard)

    expect(onSelectTrip).toHaveBeenCalledWith(trips[0])
  })

  it("shows confirmation when tapping already-imported card", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    await userEvent.click(parisCard)

    expect(onSelectTrip).not.toHaveBeenCalled()
    expect(screen.getByText(/Import again to update it/)).toBeInTheDocument()
  })

  it("cancel in confirmation closes it", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    await userEvent.click(parisCard)

    expect(screen.getByText(/Import again to update it/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText(/Import again to update it/)).not.toBeInTheDocument()
    })
  })

  it("Import in confirmation calls onSelectTrip", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    await userEvent.click(parisCard)

    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Import" }))

    expect(onSelectTrip).toHaveBeenCalledWith(trips[1])
  })

  it("Escape closes confirmation when open", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    await userEvent.click(parisCard)

    expect(screen.getByText(/Import again to update it/)).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")

    await waitFor(() => {
      expect(screen.queryByText(/Import again to update it/)).not.toBeInTheDocument()
    })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it("Escape with no confirmation calls onDismiss", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    await userEvent.keyboard("{Escape}")

    expect(onDismiss).toHaveBeenCalled()
  })

  it("close button calls onDismiss", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    await userEvent.click(screen.getByRole("button", { name: /Close trip selection/i }))

    expect(onDismiss).toHaveBeenCalled()
  })

  it("shows correct subtitle with trip count and already-imported count", () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    expect(
      screen.getByText("Found 3 trips in your export (1 already in your vault)")
    ).toBeInTheDocument()
  })

  it("shows subtitle without already-imported count when none imported", () => {
    const freshTrips = trips.map((t) => ({ ...t, alreadyImported: false }))
    render(
      <TripSelectionList trips={freshTrips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    expect(
      screen.getByText("Found 3 trips in your export")
    ).toBeInTheDocument()
  })

  it("renders heading with Select a trip", () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    expect(screen.getByText("Select a trip")).toBeInTheDocument()
  })

  it("disables other cards when one is loading (selected)", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    // Click a non-imported card to trigger loading state
    const japanCard = screen.getByRole("button", { name: /Summer in Japan/i })
    await userEvent.click(japanCard)

    // The other cards should be disabled
    const caliCard = screen.getByRole("button", { name: /Road Trip California/i })
    expect(caliCard).toBeDisabled()
  })

  it("shows loading indicator on the selected card", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const japanCard = screen.getByRole("button", { name: /Summer in Japan/i })
    await userEvent.click(japanCard)

    // The loading card should show "Importing..." text
    expect(screen.getByText(/Importing/)).toBeInTheDocument()
  })

  it("closes existing confirmation when another already-imported card is tapped", async () => {
    // Add another already-imported trip
    const tripsWithTwoImported: TripSummary[] = [
      ...trips,
      {
        id: 4,
        name: "Tokyo Winter",
        startDate: 1680000000,
        endDate: 1680500000,
        chapterCount: 6,
        tripDirPath: "trip/tokyo_4/",
        alreadyImported: true,
      },
    ]

    render(
      <TripSelectionList trips={tripsWithTwoImported} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    // Click first already-imported card (Paris)
    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    await userEvent.click(parisCard)
    expect(screen.getByText(/Import again to update it/)).toBeInTheDocument()

    // Click second already-imported card (Tokyo)
    const tokyoCard = screen.getByRole("button", { name: /Tokyo Winter/i })
    await userEvent.click(tokyoCard)

    // After animation completes, only one confirmation should be visible
    await waitFor(() => {
      const confirmations = screen.getAllByText(/Import again to update it/)
      expect(confirmations).toHaveLength(1)
    })
  })

  it("does not call onSelectTrip when a card is loading and another is clicked", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    // Select Japan (starts loading)
    const japanCard = screen.getByRole("button", { name: /Summer in Japan/i })
    await userEvent.click(japanCard)
    expect(onSelectTrip).toHaveBeenCalledTimes(1)

    // Try clicking California (should be disabled/ignored)
    const caliCard = screen.getByRole("button", { name: /Road Trip California/i })
    await userEvent.click(caliCard)
    expect(onSelectTrip).toHaveBeenCalledTimes(1)
  })

  it("card has aria-expanded attribute for already-imported trips", async () => {
    render(
      <TripSelectionList trips={trips} onSelectTrip={onSelectTrip} onDismiss={onDismiss} />
    )

    const parisCard = screen.getByRole("button", { name: /Weekend in Paris/i })
    expect(parisCard).toHaveAttribute("aria-expanded", "false")

    await userEvent.click(parisCard)
    expect(parisCard).toHaveAttribute("aria-expanded", "true")
  })
})
