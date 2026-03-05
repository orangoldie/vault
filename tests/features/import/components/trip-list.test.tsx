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
    chapterCount: 32,
    photoCount: 148,
    totalKm: 5000,
    uuid: "trip-1-uuid",
    importedAt: 1700000000,
  },
  {
    id: 2,
    name: "\u05D0\u05DC\u05D9 \u05D5\u05D0\u05D5\u05E8\u05DF \u05D1\u05DE\u05D6\u05E8\u05D7",
    slug: "eli-and-oran",
    startDate: 1739059200, // Feb 9, 2025
    endDate: 1749513600, // Jun 10, 2025
    summary: "",
    coverPhotoId: null,
    chapterCount: 56,
    photoCount: 213,
    totalKm: 23175,
    uuid: "trip-2-uuid",
    importedAt: 1700100000,
  },
]

describe("TripList", () => {
  it("renders the app name heading", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    expect(screen.getByText("Journey Vault")).toBeInTheDocument()
  })

  it("renders all trips", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
    expect(screen.getByText("\u05D0\u05DC\u05D9 \u05D5\u05D0\u05D5\u05E8\u05DF \u05D1\u05DE\u05D6\u05E8\u05D7")).toBeInTheDocument()
  })

  it("renders chapter count for each trip", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    expect(screen.getByText("32 chapters")).toBeInTheDocument()
    expect(screen.getByText("56 chapters")).toBeInTheDocument()
  })

  it("renders photo count for each trip", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    expect(screen.getByText("148 photos")).toBeInTheDocument()
    expect(screen.getByText("213 photos")).toBeInTheDocument()
  })

  it("renders date ranges for trips", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    // Check that year info is present for each trip
    expect(screen.getByText(/2024/)).toBeInTheDocument()
    expect(screen.getByText(/2025/)).toBeInTheDocument()
  })

  it("wraps trip names in bdi for RTL support", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    const hebrewName = screen.getByText("\u05D0\u05DC\u05D9 \u05D5\u05D0\u05D5\u05E8\u05DF \u05D1\u05DE\u05D6\u05E8\u05D7")
    expect(hebrewName.tagName).toBe("BDI")
    expect(hebrewName.parentElement).toHaveAttribute("dir", "auto")
  })

  it("renders an Import Trip button", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })

  it("opens file picker when Import Trip is clicked and calls onFileSelected", async () => {
    const onFileSelected = vi.fn()
    render(<TripList trips={mockTrips} onFileSelected={onFileSelected} />)

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    const file = new File(["zip"], "export.zip", { type: "application/zip" })
    await userEvent.upload(input, file)

    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it("has a hidden file input that accepts .zip files", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    expect(input).toHaveAttribute("type", "file")
    expect(input).toHaveAttribute("accept", ".zip")
    expect(input).toHaveClass("hidden")
  })

  it("renders trip cards as links to trip detail pages", () => {
    render(<TripList trips={mockTrips} onFileSelected={vi.fn()} />)

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute("href", "/trip/summer-in-europe")
    expect(links[1]).toHaveAttribute("href", "/trip/eli-and-oran")
  })

  it("renders an empty list when no trips", () => {
    render(<TripList trips={[]} onFileSelected={vi.fn()} />)

    expect(screen.getByText("Journey Vault")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })
})
