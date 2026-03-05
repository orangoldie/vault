import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ImportFlow } from "@/features/import/components/import-flow"
import { ImportError } from "@/types/import"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock the import lib and db
vi.mock("@/features/import/lib/import-trip", () => ({
  importTrip: vi.fn(),
  shouldWarnAboutSize: vi.fn(() => null),
  scanTripsFromFile: vi.fn(),
}))

vi.mock("@/stores/db", () => ({
  getAllTrips: vi.fn(() => Promise.resolve([])),
}))

import { importTrip, shouldWarnAboutSize, scanTripsFromFile } from "@/features/import/lib/import-trip"
import { getAllTrips } from "@/stores/db"

const mockImportTrip = vi.mocked(importTrip)
const mockShouldWarnAboutSize = vi.mocked(shouldWarnAboutSize)
const mockGetAllTrips = vi.mocked(getAllTrips)
const mockScanTripsFromFile = vi.mocked(scanTripsFromFile)

/** Helper: configure mocks for a single-trip ZIP that auto-imports */
function setupSingleTripScan() {
  mockScanTripsFromFile.mockResolvedValue([
    {
      id: 1,
      name: "Test Trip",
      startDate: 1700000000,
      endDate: 1700500000,
      chapterCount: 1,
      tripDirPath: "trip/test-trip_1/",
      alreadyImported: false,
    },
  ])
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPush.mockClear()
  mockGetAllTrips.mockResolvedValue([])
  mockShouldWarnAboutSize.mockReturnValue(null)
  setupSingleTripScan()
})

describe("ImportFlow", () => {
  it("shows the import prompt initially when no trips exist", async () => {
    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByText("Journey Vault")).toBeInTheDocument()
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
        chapterCount: 10,
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
    expect(screen.getByText("10 chapters")).toBeInTheDocument()
  })

  it("renders trip cards as links to trip detail pages", async () => {
    mockGetAllTrips.mockResolvedValue([
      {
        id: 1,
        name: "Existing Trip",
        slug: "existing",
        startDate: 1700000000,
        endDate: 1700500000,
        summary: "",
        coverPhotoId: null,
        chapterCount: 10,
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

    // Trip card should be a link to the detail page
    const link = screen.getByRole("link", { name: /Existing Trip/i })
    expect(link).toHaveAttribute("href", "/trip/existing")
  })

  it("navigates to trip detail after a fast import", async () => {
    mockImportTrip.mockResolvedValue({
      tripName: "My Adventure",
      slug: "my-adventure",
      chapterCount: 5,
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

    const input = screen.getByLabelText(
      "Select travel export ZIP file"
    ) as HTMLInputElement
    const file = new File(["zip"], "export.zip", { type: "application/zip" })

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trip/my-adventure")
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
      "Select travel export ZIP file"
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
      "Select travel export ZIP file"
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
      "Select travel export ZIP file"
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


  it("shows large file warning for files over 500 MB", async () => {
    mockShouldWarnAboutSize.mockReturnValue(600)

    render(<ImportFlow />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Import Trip/i })
      ).toBeInTheDocument()
    })

    const input = screen.getByLabelText(
      "Select travel export ZIP file"
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
      slug: "big-trip",
      chapterCount: 100,
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
      "Select travel export ZIP file"
    ) as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "big.zip"))

    await waitFor(() => {
      expect(screen.getByText(/Large file detected/)).toBeInTheDocument()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /Continue Import/i })
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trip/big-trip")
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
      "Select travel export ZIP file"
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
      "Select travel export ZIP file"
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

  it("auto-imports without showing selection when ZIP has single trip", async () => {
    // setupSingleTripScan() is already configured in beforeEach
    mockImportTrip.mockResolvedValue({
      tripName: "Test Trip",
      slug: "test-trip",
      photoCount: 3,
      chapterCount: 1,
      totalKm: 100,
      startDate: 1700000000,
      endDate: 1700500000,
    })

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "single.zip"))

    // Should skip selection and go directly to import
    await waitFor(() => {
      expect(mockImportTrip).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ tripDirPath: "trip/test-trip_1/" })
      )
    })

    // Should never show the selection screen
    expect(screen.queryByText("Select a trip")).not.toBeInTheDocument()
  })

  it("shows trip selection screen when ZIP has multiple trips", async () => {
    mockScanTripsFromFile.mockResolvedValue([
      {
        id: 1,
        name: "Trip One",
        startDate: 1800000000,
        endDate: 1800500000,
        chapterCount: 5,
        tripDirPath: "trip/one_1/",
        alreadyImported: false,
      },
      {
        id: 2,
        name: "Trip Two",
        startDate: 1700000000,
        endDate: 1700500000,
        chapterCount: 3,
        tripDirPath: "trip/two_2/",
        alreadyImported: true,
      },
    ])

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "multi.zip"))

    await waitFor(() => {
      expect(screen.getByText("Select a trip")).toBeInTheDocument()
      expect(screen.getByText("Trip One")).toBeInTheDocument()
      expect(screen.getByText("Trip Two")).toBeInTheDocument()
      expect(screen.getByText("Already imported")).toBeInTheDocument()
    })
  })

  it("shows error when scan finds zero valid trips", async () => {
    mockScanTripsFromFile.mockResolvedValue([])

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "empty.zip"))

    await waitFor(() => {
      expect(screen.getByText(/couldn.t read this file/i)).toBeInTheDocument()
    })
  })

  it("shows error when scan itself fails", async () => {
    mockScanTripsFromFile.mockRejectedValue(
      new ImportError("INVALID_ZIP", "Bad zip")
    )

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "bad.zip"))

    await waitFor(() => {
      expect(screen.getByText(/couldn.t read this file/i)).toBeInTheDocument()
    })
  })

  it("imports selected trip from multi-trip ZIP", async () => {
    mockScanTripsFromFile.mockResolvedValue([
      {
        id: 1,
        name: "Trip One",
        startDate: 1800000000,
        endDate: 1800500000,
        chapterCount: 5,
        tripDirPath: "trip/one_1/",
        alreadyImported: false,
      },
      {
        id: 2,
        name: "Trip Two",
        startDate: 1700000000,
        endDate: 1700500000,
        chapterCount: 3,
        tripDirPath: "trip/two_2/",
        alreadyImported: false,
      },
    ])
    mockImportTrip.mockResolvedValue({
      tripName: "Trip Two",
      slug: "trip-two",
      chapterCount: 3,
      photoCount: 10,
      startDate: 1700000000,
      endDate: 1700500000,
      totalKm: 500,
    })

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "multi.zip"))

    // Wait for selection screen
    await waitFor(() => {
      expect(screen.getByText("Select a trip")).toBeInTheDocument()
    })

    // Select Trip Two
    const tripTwoCard = screen.getByRole("button", { name: /Trip Two/i })
    await userEvent.click(tripTwoCard)

    // Should import and navigate to trip detail
    await waitFor(() => {
      expect(mockImportTrip).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ tripDirPath: "trip/two_2/" })
      )
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trip/trip-two")
    })
  })

  it("wraps non-ImportError scan failures in UNKNOWN error", async () => {
    mockScanTripsFromFile.mockRejectedValue(new Error("network crash"))

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "bad.zip"))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })
  })

  it("shows large file warning then proceeds to multi-trip selection", async () => {
    mockShouldWarnAboutSize.mockReturnValue(600)
    mockScanTripsFromFile.mockResolvedValue([
      {
        id: 1,
        name: "Trip One",
        startDate: 1800000000,
        endDate: 1800500000,
        chapterCount: 5,
        tripDirPath: "trip/one_1/",
        alreadyImported: false,
      },
      {
        id: 2,
        name: "Trip Two",
        startDate: 1700000000,
        endDate: 1700500000,
        chapterCount: 3,
        tripDirPath: "trip/two_2/",
        alreadyImported: false,
      },
    ])

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "big.zip"))

    // Should show large file warning first
    await waitFor(() => {
      expect(screen.getByText(/Large file detected/)).toBeInTheDocument()
    })

    // Confirm
    await userEvent.click(screen.getByRole("button", { name: /Continue Import/i }))

    // Should then show selection screen
    await waitFor(() => {
      expect(screen.getByText("Select a trip")).toBeInTheDocument()
      expect(screen.getByText("Trip One")).toBeInTheDocument()
      expect(screen.getByText("Trip Two")).toBeInTheDocument()
    })
  })

  it("dismisses selection screen and returns to idle", async () => {
    mockScanTripsFromFile.mockResolvedValue([
      {
        id: 1,
        name: "Trip One",
        startDate: 1800000000,
        endDate: 1800500000,
        chapterCount: 5,
        tripDirPath: "trip/one_1/",
        alreadyImported: false,
      },
      {
        id: 2,
        name: "Trip Two",
        startDate: 1700000000,
        endDate: 1700500000,
        chapterCount: 3,
        tripDirPath: "trip/two_2/",
        alreadyImported: false,
      },
    ])

    render(<ImportFlow />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import Trip/i })).toBeInTheDocument()
    })

    const input = screen.getByLabelText("Select travel export ZIP file") as HTMLInputElement
    await userEvent.upload(input, new File(["z"], "multi.zip"))

    await waitFor(() => {
      expect(screen.getByText("Select a trip")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: /Close trip selection/i }))

    await waitFor(() => {
      expect(screen.getByText("Journey Vault")).toBeInTheDocument()
    })
  })
})
