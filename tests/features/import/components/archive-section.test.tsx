import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { ArchiveSection } from "@/features/import/components/archive-section"
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
    name: "Winter in Japan",
    slug: "winter-in-japan",
    startDate: 1701388800, // Dec 1, 2023
    endDate: 1704153600, // Jan 2, 2024
    summary: "Snow and temples",
    coverPhotoId: null,
    chapterCount: 18,
    photoCount: 95,
    totalKm: 1200,
    uuid: "trip-2-uuid",
    importedAt: 1700100000,
  },
]

describe("ArchiveSection", () => {
  it("renders all trips", () => {
    render(<ArchiveSection trips={mockTrips} />)

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
    expect(screen.getByText("Winter in Japan")).toBeInTheDocument()
  })

  it("each trip card links to /trip/:slug", () => {
    render(<ArchiveSection trips={mockTrips} />)

    const links = screen.getAllByRole("link")
    const hrefs = links.map((l) => l.getAttribute("href"))

    expect(hrefs).toContain("/trip/summer-in-europe")
    expect(hrefs).toContain("/trip/winter-in-japan")
  })

  it("renders the trip name inside each card", () => {
    render(<ArchiveSection trips={mockTrips} />)

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
    expect(screen.getByText("Winter in Japan")).toBeInTheDocument()
  })

  it("renders the date range for each trip", () => {
    render(<ArchiveSection trips={mockTrips} />)

    // Jul 1 – Aug 15, 2024 (same year — no year on start)
    expect(screen.getByText(/Jul 1/)).toBeInTheDocument()
    // Dec 2023 – Jan 2024 (cross-year — both years shown)
    expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument()
  })

  it("renders the chapter count for each trip", () => {
    render(<ArchiveSection trips={mockTrips} />)

    expect(screen.getByText("32 chapters")).toBeInTheDocument()
    expect(screen.getByText("18 chapters")).toBeInTheDocument()
  })

  it("renders the photo count for each trip", () => {
    render(<ArchiveSection trips={mockTrips} />)

    expect(screen.getByText("148 photos")).toBeInTheDocument()
    expect(screen.getByText("95 photos")).toBeInTheDocument()
  })

  it("renders trip names inside bdi elements for bidirectional text support", () => {
    render(<ArchiveSection trips={mockTrips} />)

    const tripName = screen.getByText("Summer in Europe")
    expect(tripName.tagName).toBe("BDI")
    expect(tripName.parentElement).toHaveAttribute("dir", "auto")
  })

  it("renders an empty archive when no trips are passed", () => {
    render(<ArchiveSection trips={[]} />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("renders the archive section heading", () => {
    render(<ArchiveSection trips={mockTrips} />)

    expect(screen.getByText("Your archive")).toBeInTheDocument()
  })
})
