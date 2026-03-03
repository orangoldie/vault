import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { ImportProgress } from "@/features/import/components/import-progress"

describe("ImportProgress", () => {
  it("renders the progress percentage", () => {
    render(
      <ImportProgress
        tripName="My Trip"
        progress={{ phase: "extracting", percent: 42, detail: "Extracting ZIP..." }}
      />
    )

    expect(screen.getByText("42%")).toBeInTheDocument()
  })

  it("renders the detail text", () => {
    render(
      <ImportProgress
        tripName="My Trip"
        progress={{ phase: "storing", percent: 63, detail: "Importing photos… 134 of 213" }}
      />
    )

    expect(screen.getByText("Importing photos… 134 of 213")).toBeInTheDocument()
  })

  it("renders the trip name when provided", () => {
    render(
      <ImportProgress
        tripName="Summer in Europe"
        progress={{ phase: "reading", percent: 8, detail: "Reading trip data..." }}
      />
    )

    expect(screen.getByText("Summer in Europe")).toBeInTheDocument()
  })

  it("does not render trip name when null", () => {
    render(
      <ImportProgress
        tripName={null}
        progress={{ phase: "extracting", percent: 0, detail: "Extracting ZIP..." }}
      />
    )

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("wraps the trip name in bdi for RTL/LTR support", () => {
    render(
      <ImportProgress
        tripName="אלי ואורן במזרח"
        progress={{ phase: "reading", percent: 10, detail: "Reading trip data..." }}
      />
    )

    const heading = screen.getByText("אלי ואורן במזרח")
    expect(heading.tagName).toBe("BDI")
    expect(heading.parentElement).toHaveAttribute("dir", "auto")
  })

  it("renders an accessible progress bar", () => {
    render(
      <ImportProgress
        tripName="My Trip"
        progress={{ phase: "storing", percent: 75, detail: "Importing photos…" }}
      />
    )

    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("has an aria-live region for screen readers", () => {
    render(
      <ImportProgress
        tripName="My Trip"
        progress={{ phase: "storing", percent: 50, detail: "Importing photos… 100 of 200" }}
      />
    )

    const liveRegion = screen.getByText("Importing photos… 100 of 200")
    expect(liveRegion).toHaveAttribute("aria-live", "polite")
  })
})
