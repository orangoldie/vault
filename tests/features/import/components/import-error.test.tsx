import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ImportErrorView } from "@/features/import/components/import-error"
import type { ImportErrorCode } from "@/types/import"

describe("ImportErrorView", () => {
  it("renders the error heading", () => {
    render(<ImportErrorView code="INVALID_ZIP" onRetry={vi.fn()} />)

    expect(screen.getByText(/couldn.t read this file/i)).toBeInTheDocument()
  })

  it("renders a Try Again button", () => {
    render(<ImportErrorView code="INVALID_ZIP" onRetry={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument()
  })

  it("calls onRetry when Try Again is clicked", async () => {
    const onRetry = vi.fn()
    render(<ImportErrorView code="UNKNOWN" onRetry={onRetry} />)

    await userEvent.click(screen.getByRole("button", { name: /Try Again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  const errorMessages: [ImportErrorCode, RegExp][] = [
    ["INVALID_ZIP", /doesn.t appear to be a ZIP file/],
    ["MISSING_TRIP_JSON", /No trip data was found/],
    ["MALFORMED_JSON", /trip data in this file appears to be damaged/],
    ["EMPTY_TRIP", /doesn.t contain any steps or photos/],
    ["QUOTA_EXCEEDED", /isn.t enough storage space/],
    ["FILE_TOO_LARGE", /file may be too large to process/],
    ["UNKNOWN", /Something went wrong/],
  ]

  it.each(errorMessages)(
    "shows the correct message for %s",
    (code, expectedPattern) => {
      render(<ImportErrorView code={code} onRetry={vi.fn()} />)

      expect(screen.getByText(expectedPattern)).toBeInTheDocument()
    }
  )

  it("renders a warning icon (not alarming)", () => {
    const { container } = render(
      <ImportErrorView code="INVALID_ZIP" onRetry={vi.fn()} />
    )

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })
})
