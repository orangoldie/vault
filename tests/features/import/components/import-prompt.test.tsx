import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ImportPrompt } from "@/features/import/components/import-prompt"

describe("ImportPrompt", () => {
  it("renders the app name and tagline", () => {
    render(<ImportPrompt onFileSelected={vi.fn()} />)

    expect(screen.getByText("Journey Vault")).toBeInTheDocument()
    expect(screen.getByText("Your travels, your archive.")).toBeInTheDocument()
    expect(
      screen.getByText(/Import your travel data export/)
    ).toBeInTheDocument()
  })

  it("renders the Import Trip button", () => {
    render(<ImportPrompt onFileSelected={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })

  it("renders a hidden file input that accepts .zip files", () => {
    render(<ImportPrompt onFileSelected={vi.fn()} />)

    const input = screen.getByLabelText("Select travel export ZIP file")
    expect(input).toHaveAttribute("type", "file")
    expect(input).toHaveAttribute("accept", ".zip")
    expect(input).toHaveClass("hidden")
  })

  it("renders helper text below the button", () => {
    render(<ImportPrompt onFileSelected={vi.fn()} />)

    expect(
      screen.getByText("Select your travel export ZIP file")
    ).toBeInTheDocument()
  })

  it("calls onFileSelected when a file is chosen", async () => {
    const onFileSelected = vi.fn()
    render(<ImportPrompt onFileSelected={onFileSelected} />)

    const input = screen.getByLabelText(
      "Select travel export ZIP file"
    ) as HTMLInputElement
    const file = new File(["zip-content"], "export.zip", {
      type: "application/zip",
    })

    await userEvent.upload(input, file)

    expect(onFileSelected).toHaveBeenCalledOnce()
    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it("resets the file input after selection so the same file can be re-selected", async () => {
    const onFileSelected = vi.fn()
    render(<ImportPrompt onFileSelected={onFileSelected} />)

    const input = screen.getByLabelText(
      "Select travel export ZIP file"
    ) as HTMLInputElement
    const file = new File(["zip"], "export.zip", { type: "application/zip" })

    await userEvent.upload(input, file)

    expect(input.value).toBe("")
  })

  it("does not call onFileSelected when no file is selected (cancel)", () => {
    const onFileSelected = vi.fn()
    render(<ImportPrompt onFileSelected={onFileSelected} />)

    // Simulating no file selected — change event fires but files is empty
    const input = screen.getByLabelText("Select travel export ZIP file")
    input.dispatchEvent(new Event("change", { bubbles: true }))

    expect(onFileSelected).not.toHaveBeenCalled()
  })
})
