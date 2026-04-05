import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ExportInstructions } from "@/features/import/components/export-instructions"

describe("ExportInstructions", () => {
  it("renders the instruction text", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    expect(screen.getByText(/Export your data from/)).toBeInTheDocument()
    expect(
      screen.getByText(/then upload the ZIP file below/)
    ).toBeInTheDocument()
  })

  it("renders an external link with correct security attributes", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    const link = screen.getByRole("link", { name: /your travel app/i })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders the upload zone region", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    expect(
      screen.getByRole("region", { name: "File upload area" })
    ).toBeInTheDocument()
  })

  it("renders the 'Select file' button", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: "Select file" })
    ).toBeInTheDocument()
  })

  it("renders a hidden file input that accepts .zip files", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    const input = screen.getByLabelText("Select travel export ZIP file")
    expect(input).toHaveAttribute("type", "file")
    expect(input).toHaveAttribute("accept", ".zip")
    expect(input).toHaveClass("hidden")
  })

  it("'Select file' button triggers a click on the hidden file input", async () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    const input = screen.getByLabelText(
      "Select travel export ZIP file"
    ) as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click")

    await userEvent.click(screen.getByRole("button", { name: "Select file" }))

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it("calls onFileSelected with the file when a file is chosen via the input", async () => {
    const onFileSelected = vi.fn()
    render(<ExportInstructions onFileSelected={onFileSelected} />)

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

  it("calls onFileSelected with the dropped file when a file is dropped", () => {
    const onFileSelected = vi.fn()
    render(<ExportInstructions onFileSelected={onFileSelected} />)

    const dropZone = screen.getByRole("region", { name: "File upload area" })
    const file = new File(["zip-content"], "dropped.zip", {
      type: "application/zip",
    })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    })

    expect(onFileSelected).toHaveBeenCalledOnce()
    expect(onFileSelected).toHaveBeenCalledWith(file)
  })

  it("does not call onFileSelected when a drop occurs with no files", () => {
    const onFileSelected = vi.fn()
    render(<ExportInstructions onFileSelected={onFileSelected} />)

    const dropZone = screen.getByRole("region", { name: "File upload area" })

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [] },
    })

    expect(onFileSelected).not.toHaveBeenCalled()
  })

  it("adds highlighted classes to the upload zone when a file is dragged over", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    const dropZone = screen.getByRole("region", { name: "File upload area" })

    fireEvent.dragOver(dropZone, {
      relatedTarget: null,
    })

    expect(dropZone).toHaveClass("border-vault-gold/60")
    expect(dropZone).toHaveClass("bg-vault-gold/[0.04]")
  })

  it("removes highlighted classes from the upload zone when the drag leaves", () => {
    render(<ExportInstructions onFileSelected={vi.fn()} />)

    const dropZone = screen.getByRole("region", { name: "File upload area" })

    fireEvent.dragOver(dropZone)
    // relatedTarget is null/outside — triggers the "leaving entirely" branch
    fireEvent.dragLeave(dropZone, { relatedTarget: null })

    expect(dropZone).not.toHaveClass("border-vault-gold/60")
    expect(dropZone).not.toHaveClass("bg-vault-gold/[0.04]")
  })
})
