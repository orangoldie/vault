import { describe, it, expect } from "vitest"

import { extractZip } from "@/features/import/lib/extract-zip"

// Note: fflate round-trip through jsdom's File.arrayBuffer() corrupts data,
// so the happy path is tested via E2E tests in a real browser.
// These tests validate error handling only.

describe("extractZip", () => {
  it("throws INVALID_ZIP for non-ZIP data", async () => {
    const file = new File(["not a zip file"], "test.zip")
    await expect(extractZip(file)).rejects.toThrow("Failed to extract ZIP")
  })

  it("throws INVALID_ZIP for empty file", async () => {
    const file = new File([], "test.zip")
    await expect(extractZip(file)).rejects.toThrow("Failed to extract ZIP")
  })

  it("sets error code to INVALID_ZIP", async () => {
    const file = new File(["garbage"], "test.zip")
    try {
      await extractZip(file)
      expect.fail("Should have thrown")
    } catch (err) {
      expect((err as { code: string }).code).toBe("INVALID_ZIP")
    }
  })
})
