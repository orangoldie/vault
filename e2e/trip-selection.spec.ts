import { test, expect } from "@playwright/test"
import path from "path"

const singleTripZip = path.resolve(__dirname, "fixtures/test-export.zip")
const multiTripZip = path.resolve(__dirname, "fixtures/multi-trip-export.zip")

test.describe("Trip Selection Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase("journey-vault")
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
        req.onblocked = () => resolve()
      })
      const root = await navigator.storage.getDirectory()
      for await (const name of root.keys()) {
        await root.removeEntry(name, { recursive: true })
      }
    })
    await page.reload()
    await page.waitForLoadState("domcontentloaded")
    await expect(
      page.getByRole("button", { name: /Import Trip/i })
    ).toBeVisible({ timeout: 15000 })
  })

  test("single-trip ZIP skips selection and imports directly", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(singleTripZip)

    // Should skip selection and show success directly
    await expect(page.getByText("imported successfully")).toBeVisible({ timeout: 15000 })
    // Selection screen should never appear
    expect(await page.getByText("Select a trip").isVisible().catch(() => false)).toBe(false)
  })

  test("multi-trip ZIP shows selection screen with all trips", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    // Should show trip selection screen
    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Found 2 trips in your export")).toBeVisible()

    // Both trips should be listed
    await expect(page.getByText("Summer Road Trip")).toBeVisible()
    await expect(page.getByText("Winter Escape")).toBeVisible()

    // Chapter counts should be visible
    await expect(page.getByText("3 chapters")).toBeVisible()
    await expect(page.getByText("2 chapters")).toBeVisible()
  })

  test("selecting a trip from multi-trip ZIP imports it", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })

    // Click on "Winter Escape" trip
    await page.getByRole("button", { name: /Winter Escape/i }).click()

    // Should show success
    await expect(page.getByText("Winter Escape")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("imported successfully")).toBeVisible()
    await expect(page.getByText("2 chapters")).toBeVisible()
  })

  test("dismiss selection screen returns to home", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })

    // Click close button
    await page.getByRole("button", { name: /Close trip selection/i }).click()

    // Should return to import prompt
    await expect(page.getByRole("button", { name: /Import Trip/i })).toBeVisible()
  })

  test("already-imported badge shows for previously imported trip", async ({ page }) => {
    // First: import one trip from multi-trip ZIP
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })
    await page.getByRole("button", { name: /Summer Road Trip/i }).click()

    await expect(page.getByText("imported successfully")).toBeVisible({ timeout: 15000 })

    // Return to home
    await page.getByRole("button", { name: /Done/i }).click()
    await expect(page.getByText("Summer Road Trip")).toBeVisible()

    // Second: import the same ZIP again — now "Summer Road Trip" should be marked
    // Need to navigate to import. The trip list has an Import Trip button.
    const fileInput2 = page.locator('input[type="file"]')
    await fileInput2.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Already imported")).toBeVisible()
    await expect(page.getByText(/1 already in your vault/)).toBeVisible()
  })

  test("re-import confirmation appears for already-imported trip", async ({ page }) => {
    // Import a trip first
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })
    await page.getByRole("button", { name: /Winter Escape/i }).click()
    await expect(page.getByText("imported successfully")).toBeVisible({ timeout: 15000 })

    await page.getByRole("button", { name: /Done/i }).click()

    // Re-import same ZIP
    const fileInput2 = page.locator('input[type="file"]')
    await fileInput2.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })

    // Click the already-imported trip
    await page.getByRole("button", { name: /Winter Escape/i }).click()

    // Should show confirmation
    await expect(page.getByText(/Import again to update it/)).toBeVisible()

    // Cancel should close confirmation
    await page.getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByText(/Import again to update it/)).not.toBeVisible()
  })

  test("Escape key dismisses selection screen", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(multiTripZip)

    await expect(page.getByText("Select a trip")).toBeVisible({ timeout: 15000 })

    await page.keyboard.press("Escape")

    await expect(page.getByRole("button", { name: /Import Trip/i })).toBeVisible()
  })
})
