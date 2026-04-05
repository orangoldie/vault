import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { SourcePicker } from "@/features/import/components/source-picker"

describe("SourcePicker", () => {
  it("renders both source options", () => {
    render(<SourcePicker selected={null} onSelect={vi.fn()} />)

    expect(screen.getByRole("radio", { name: "Polarsteps" })).toBeInTheDocument()
    expect(
      screen.getByRole("radio", { name: "FindPenguins, coming soon" })
    ).toBeInTheDocument()
  })

  it("renders the 'Coming soon' badge on the secondary card", () => {
    render(<SourcePicker selected={null} onSelect={vi.fn()} />)

    expect(screen.getByText("Coming soon")).toBeInTheDocument()
  })

  it("calls onSelect with 'primary' when the primary card is clicked", async () => {
    const onSelect = vi.fn()
    render(<SourcePicker selected={null} onSelect={onSelect} />)

    await userEvent.click(screen.getByRole("radio", { name: "Polarsteps" }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith("primary")
  })

  it("shows primary card as selected when selected='primary'", () => {
    render(<SourcePicker selected="primary" onSelect={vi.fn()} />)

    expect(
      screen.getByRole("radio", { name: "Polarsteps" })
    ).toHaveAttribute("aria-checked", "true")
  })

  it("shows primary card as not selected when selected is null", () => {
    render(<SourcePicker selected={null} onSelect={vi.fn()} />)

    expect(
      screen.getByRole("radio", { name: "Polarsteps" })
    ).toHaveAttribute("aria-checked", "false")
  })

  it("secondary card has aria-disabled='true'", () => {
    render(<SourcePicker selected={null} onSelect={vi.fn()} />)

    expect(
      screen.getByRole("radio", { name: "FindPenguins, coming soon" })
    ).toHaveAttribute("aria-disabled", "true")
  })

  it("does not call onSelect when the secondary (disabled) card is clicked", async () => {
    const onSelect = vi.fn()
    render(<SourcePicker selected={null} onSelect={onSelect} />)

    await userEvent.click(
      screen.getByRole("radio", { name: "FindPenguins, coming soon" })
    )

    expect(onSelect).not.toHaveBeenCalled()
  })

  it("calls onSelect when Enter is pressed on the primary card", async () => {
    const onSelect = vi.fn()
    render(<SourcePicker selected={null} onSelect={onSelect} />)

    const primaryCard = screen.getByRole("radio", { name: "Polarsteps" })
    primaryCard.focus()
    await userEvent.keyboard("{Enter}")

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith("primary")
  })

  it("calls onSelect when Space is pressed on the primary card", async () => {
    const onSelect = vi.fn()
    render(<SourcePicker selected={null} onSelect={onSelect} />)

    const primaryCard = screen.getByRole("radio", { name: "Polarsteps" })
    primaryCard.focus()
    await userEvent.keyboard(" ")

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith("primary")
  })

  it("renders within a radiogroup with accessible label", () => {
    render(<SourcePicker selected={null} onSelect={vi.fn()} />)

    expect(
      screen.getByRole("radiogroup", { name: "Select data source" })
    ).toBeInTheDocument()
  })
})
