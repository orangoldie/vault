import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ImportSummary } from "@/features/import/components/import-summary"
import type { ImportResult } from "@/types/import"

const mockResult: ImportResult = {
  tripName: "Summer in Europe",
  chapterCount: 56,
  photoCount: 213,
  startDate: 1739059200, // Feb 9, 2025
  endDate: 1749513600, // Jun 10, 2025
  totalKm: 23175,
}

describe("ImportSummary", () => {
  it("renders the trip name", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
  })

  it("renders 'imported successfully' message", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    expect(screen.getByText("imported successfully")).toBeInTheDocument()
  })

  it("renders chapter count", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    expect(screen.getByText("56 chapters")).toBeInTheDocument()
  })

  it("renders photo count", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    expect(screen.getByText("213 photos")).toBeInTheDocument()
  })

  it("renders formatted distance", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    expect(screen.getByText("23,175 km")).toBeInTheDocument()
  })

  it("renders the date range", () => {
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    // The exact format depends on locale, but check that a date range is present
    const dateText = screen.getByText(/2025/)
    expect(dateText).toBeInTheDocument()
  })

  it("wraps trip name in bdi for RTL support", () => {
    const rtlResult: ImportResult = {
      ...mockResult,
      tripName: "אלי ואורן במזרח",
    }
    render(
      <ImportSummary result={rtlResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    const tripName = screen.getByText("אלי ואורן במזרח")
    expect(tripName.tagName).toBe("BDI")
    expect(tripName.parentElement).toHaveAttribute("dir", "auto")
  })

  it("calls onImportAnother when 'Import Another' is clicked", async () => {
    const onImportAnother = vi.fn()
    render(
      <ImportSummary result={mockResult} onImportAnother={onImportAnother} onDone={vi.fn()} />
    )

    await userEvent.click(screen.getByRole("button", { name: /Import Another/i }))
    expect(onImportAnother).toHaveBeenCalledOnce()
  })

  it("calls onDone when 'Done' is clicked", async () => {
    const onDone = vi.fn()
    render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={onDone} />
    )

    await userEvent.click(screen.getByRole("button", { name: /Done/i }))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it("renders a success icon (CircleCheck)", () => {
    const { container } = render(
      <ImportSummary result={mockResult} onImportAnother={vi.fn()} onDone={vi.fn()} />
    )

    // Lucide renders SVG icons
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
