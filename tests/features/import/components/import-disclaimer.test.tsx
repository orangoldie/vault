import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { ImportDisclaimer } from "@/features/import/components/import-disclaimer"

describe("ImportDisclaimer", () => {
  it("renders the disclaimer text", () => {
    render(<ImportDisclaimer />)

    expect(
      screen.getByText(/Journey Vault is an independent tool/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/not affiliated with/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/processed entirely in your browser/)
    ).toBeInTheDocument()
  })

  it("has aria-label='Legal notice' on the aside element", () => {
    render(<ImportDisclaimer />)

    expect(
      screen.getByRole("complementary", { name: "Legal notice" })
    ).toBeInTheDocument()
  })

  it("mentions that trip data is never transmitted to any server", () => {
    render(<ImportDisclaimer />)

    expect(
      screen.getByText(/never transmitted to any server/)
    ).toBeInTheDocument()
  })

  it("mentions that trademarks belong to their respective owners", () => {
    render(<ImportDisclaimer />)

    expect(
      screen.getByText(/trademarks and brand names belong to their respective owners/)
    ).toBeInTheDocument()
  })
})
