import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { CompassRose } from "@/features/trip-detail/components/compass-rose"

describe("CompassRose", () => {
  it("renders an SVG with cardinal direction labels", () => {
    render(<CompassRose />)

    expect(screen.getByText("N")).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
    expect(screen.getByText("E")).toBeInTheDocument()
    expect(screen.getByText("W")).toBeInTheDocument()
  })

  it("renders with default size of 220", () => {
    const { container } = render(<CompassRose />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "220")
    expect(svg).toHaveAttribute("height", "220")
  })

  it("renders with custom size", () => {
    const { container } = render(<CompassRose size={300} />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "300")
    expect(svg).toHaveAttribute("height", "300")
  })

  it("is hidden from screen readers", () => {
    const { container } = render(<CompassRose />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
  })

  it("applies custom className", () => {
    const { container } = render(<CompassRose className="test-class" />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveClass("test-class")
  })

  it("has pointer-events-none to not block clicks", () => {
    const { container } = render(<CompassRose />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveClass("pointer-events-none")
  })
})
