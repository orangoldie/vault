import { describe, it, expect } from "vitest"

import { createStaticPhotoSource } from "@/features/export-web/viewer/static-photo-source"

const photos = [
  { id: "p1", tripId: 1, chapterId: 10, filename: "img1.jpg", exportPath: "./photos/10/img1.jpg" },
  { id: "p2", tripId: 1, chapterId: 10, filename: "img2.jpg", exportPath: "./photos/10/img2.jpg" },
  { id: "p3", tripId: 1, chapterId: 20, filename: "img3.jpg", exportPath: "./photos/20/img3.jpg" },
]

describe("createStaticPhotoSource", () => {
  const source = createStaticPhotoSource(photos)

  it("returns photos filtered by chapterId", async () => {
    const ch10 = await source.getPhotos(10)
    expect(ch10).toHaveLength(2)
    expect(ch10.map((p) => p.id)).toEqual(["p1", "p2"])

    const ch20 = await source.getPhotos(20)
    expect(ch20).toHaveLength(1)
    expect(ch20[0].id).toBe("p3")
  })

  it("returns empty array for unknown chapterId", async () => {
    const result = await source.getPhotos(999)
    expect(result).toEqual([])
  })

  it("resolves photo URL to the export path", async () => {
    const url = await source.resolveUrl(photos[0])
    expect(url).toBe("./photos/10/img1.jpg")
  })

  it("returns null for unknown photo", async () => {
    const url = await source.resolveUrl({
      id: "unknown",
      tripId: 1,
      chapterId: 10,
      filename: "nope.jpg",
    })
    expect(url).toBeNull()
  })

  it("revokeUrl is a no-op that does not throw", () => {
    expect(() => source.revokeUrl("anything")).not.toThrow()
  })
})
