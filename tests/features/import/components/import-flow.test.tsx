import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ImportFlow } from "@/features/import/components/import-flow"
import { ImportError } from "@/types/import"

// Mock the import lib and db
vi.mock("@/features/import/lib/import-trip", () => ({
  importTrip: vi.fn(),
  shouldWarnAboutSize: vi.fn(() => null),
}))

vi.mock("@/stores/db", () => ({
  getAllTrips: vi.fn(() => Promise.resolve([])),
}))

import { importTrip, shouldWarnAboutSize } from "@/features/import/lib/import-trip"
import { getAllTrips } from "@/stores/db"

const mockImportTrip = vi.mocked(importTrip)
const mockShouldWarnAboutSize = vi.mocked(shouldWarnAboutSize)
const mockGetAllTrips = vi.mocked(getAllTrips)

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAllTrips.mockResolvedValue([])
  mockShouldWarnAboutSize.mockReturnValue(null)
})

describe("ImportFlow", () => {
  it("shows the import prompt initially when no trips exist", async () => {
    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByText("Polarsteps Vault")).toBeInTheDocument()
    })
    expect(
      screen.getByRole("button", { name: /Import Trip/i })
    ).toBeInTheDocument()
  })

  it("shows the trip list when trips already exist", async () => {
    mockGetAllTrips.mockResolvedValue([
      {
        id: 1,
        name: "Existing Trip",
        slug: "existing",
        startDate: 1700000000,
        endDate: 1700500000,
        summary: "",
        coverPhotoId: null,
        stepCount: 10,
        photoCount: 50,
        totalKm: 1000,
        uuid: "uuid",
        importedAt: 1700000000,
      },
    ])

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByText("Existing Trip")).toBeInTheDocument()
    })
    expect(screen.getByText("10 steps")).toBeInTheDocument()
  })

  it("transitions to success state after a fast import", async () => {
    mockImportTrip.mockResolvedValue({
      tripName: "My Adventure",
      stepCount: 5,
      photoCount: 0,
      startDate: 1700000000,
      endDate: 1700500000,
      totalKm: 500,
    })

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    // Simulate file selection
    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    const file = new File(["zip"], "export.zip", { type: "application/zip" })

    await userEvent.upload(input, file)

    // Should show success
    await waitFor(() => {
      expect(screen.getByText("My Adventure")).toBeInTheDocument()
      expect(screen.getByText("imported successfully")).toBeInTheDocument()
    })
  })

  it("transitions to error state on import failure", async () => {
    mockImportTrip.mockRejectedValue(
      new ImportError("INVALID_ZIP", "Invalid zip")
    )

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    const file = new File(["bad"], "bad.zip", { type: "application/zip" })

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/couldn.t read this file/i)).toBeInTheDocument()
      expect(screen.getByText(/doesn.t appear to be a ZIP file/)).toBeInTheDocument()
    })
  })

  it("wraps unknown errors in an ImportError with UNKNOWN code", async () => {
    mockImportTrip.mockRejectedValue(new Error("unexpected crash"))

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    const file = new File(["bad"], "bad.zip")

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })
  })

  it("returns to idle state when Try Again is clicked after an error", async () => {
    mockImportTrip.mockRejectedValue(
      new ImportError("MISSING_TRIP_JSON", "No trip.json")
    )

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "t.zip"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /Try Again/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })
  })

  it("returns to idle state when Done is clicked after success", async () => {
    mockImportTrip.mockResolvedValue({
      tripName: "Trip",
      stepCount: 1,
      photoCount: 0,
      startDate: 1700000000,
      endDate: 1700500000,
      totalKm: 100,
    })

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "t.zip"))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Done/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /Done/i }))

    await waitFor(() => {
      expect(screen.getByText("Polarsteps Vault")).toBeInTheDocument()
    })
  })

  it("shows large file warning for files over 500 MB", async () => {
    mockShouldWarnAboutSize.mockReturnValue(600)

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    const file = new File(["z"], "big.zip")

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/Large file detected/)).toBeInTheDocument()
      expect(screen.getByText(/600 MB/)).toBeInTheDocument()
    })
  })

  it("proceeds with import when large file is confirmed", async () => {
    mockShouldWarnAboutSize.mockReturnValue(600)
    mockImportTrip.mockResolvedValue({
      tripName: "Big Trip",
      stepCount: 100,
      photoCount: 500,
      startDate: 1700000000,
      endDate: 1700500000,
      totalKm: 50000,
    })

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "big.zip"))

    await waitFor(() => {
      expect(screen.getByText(/Large file detected/)).toBeInTheDocument()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /Continue Import/i })
    )

    await waitFor(() => {
      expect(screen.getByText("Big Trip")).toBeInTheDocument()
      expect(screen.getByText("imported successfully")).toBeInTheDocument()
    })
  })

  it("returns to idle when large file warning is cancelled", async () => {
    mockShouldWarnAboutSize.mockReturnValue(600)

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "big.zip"))

    await waitFor(() => {
      expect(screen.getByText(/Large file detected/)).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }))

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })
  })

  it("shows QUOTA_EXCEEDED error with storage space message", async () => {
    mockImportTrip.mockRejectedValue(
      new ImportError("QUOTA_EXCEEDED", "Not enough storage space")
    )

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select Polarsteps export ZIP file"
    ) as HTMLInputElement
    const file = new File(["zip"], "big.zip", { type: "application/zip" })

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/isn.t enough storage space/)).toBeInTheDocument()
    })
  })

  it("has an aria-live region for accessibility", () => {
    render(<ImportFlow />)

    const container = document.querySelector("[aria-live]")
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute("aria-live", "polite")
  })
})
