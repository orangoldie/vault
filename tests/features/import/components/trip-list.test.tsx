import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { TripList } from "@/features/import/components/trip-list"
import type { Trip } from "@/types/trip"

const mockTrips: Trip[] = [
  {
    id: 1,
    name: "Summer in Europe",
    slug: "summer-in-europe",
    startDate: 1719792000, // Jul 1, 2024
    endDate: 1723680000, // Aug 15, 2024
    summary: "A great summer trip",
    coverPhotoId: null,
    stepCount: 32,
    photoCount: 148,
    totalKm: 5000,
    uuid: "trip-1-uuid",
    importedAt: 1700000000,
  },
  {
    id: 2,
    name: "אלי ואורן במזרח",
    slug: "eli-and-oran",
    startDate: 1739059200, // Feb 9, 2025
    endDate: 1749513600, // Jun 10, 2025
    summary: "",
    coverPhotoId: null,
    stepCount: 56,
    photoCount: 213,
    totalKm: 23175,
    uuid: "trip-2-uuid",
    importedAt: 1700100000,
  },
]

describe("TripList", () => {
  it("renders the app name heading", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    expect(screen.getByText("Polarsteps Vault")).toBeInTheDocument()
  })

  it("renders all trips", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
    expect(screen.getByText("אלי ואורן במזרח")).toBeInTheDocument()
  })

  it("renders step count for each trip", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    expect(screen.getByText("32 steps")).toBeInTheDocument()
    expect(screen.getByText("56 steps")).toBeInTheDocument()
  })

  it("renders photo count for each trip", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    expect(screen.getByText("148 photos")).toBeInTheDocument()
    expect(screen.getByText("213 photos")).toBeInTheDocument()
  })

  it("renders date ranges for trips", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    // Check that year info is present for each trip
    expect(screen.getByText(/2024/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it("wraps trip names in bdi for RTL support", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    const hebrewName = screen.getByText("אלי ואורן במזרח")
    expect(hebrewName.tagName).toBe("BDI")
    expect(hebrewName.parentElement).toHaveAttribute("dir", "auto")
  })

  it("renders an Import Trip button", () => {
    render(<TripList trips={mockTrips} onImport={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })

  it("calls onImport when Import Trip is clicked", async () => {
    const onImport = vi.fn()
    render(<TripList trips={mockTrips} onImport={onImport} />)

    await userEvent.click(screen.getByRole("button", { name: /Import Trip/i }))
    expect(onImport).toHaveBeenCalledOnce()
  })

  it("renders an empty list when no trips", () => {
    render(<TripList trips={[]} onImport={vi.fn()} />)

    expect(screen.getByText("Polarsteps Vault")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })
})
