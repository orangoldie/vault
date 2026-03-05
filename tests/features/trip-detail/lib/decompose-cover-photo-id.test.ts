import { describe, it, expect } from "vitest"

import { decomposeCoverPhotoId } from "@/features/trip-detail/lib/decompose-cover-photo-id"

describe("decomposeCoverPhotoId", () => {
  it("splits a simple coverPhotoId into tripId, chapterId, and filename", () => {
    const result = decomposeCoverPhotoId("1-2-photo.jpg")
    expect(result).toEqual({
      tripId: 1,
      chapterId: 2,
      filename: "photo.jpg",
    })
  })

  it("handles filenames with hyphens", () => {
    const result = decomposeCoverPhotoId("1-2-photo-2025-01-01.jpg")
    expect(result).toEqual({
      tripId: 1,
      chapterId: 2,
      filename: "photo-2025-01-01.jpg",
    })
  })

  it("handles filenames with multiple dots", () => {
    const result = decomposeCoverPhotoId("10-200-my.photo.file.png")
    expect(result).toEqual({
      tripId: 10,
      chapterId: 200,
      filename: "my.photo.file.png",
    })
  })

  it("handles large numeric IDs", () => {
    const result = decomposeCoverPhotoId("999999-888888-image.webp")
    expect(result).toEqual({
      tripId: 999999,
      chapterId: 888888,
      filename: "image.webp",
    })
  })

  it("handles filename with only hyphens", () => {
    const result = decomposeCoverPhotoId("1-2----.jpg")
    expect(result).toEqual({
      tripId: 1,
      chapterId: 2,
      filename: "---.jpg",
    })
  })

  it("throws for a string with no hyphens", () => {
    expect(() => decomposeCoverPhotoId("nohyphens")).toThrow(
      /Invalid coverPhotoId format/
    )
  })

  it("throws for a string with only one hyphen", () => {
    expect(() => decomposeCoverPhotoId("1-photo.jpg")).toThrow(
      /Invalid coverPhotoId format/
    )
  })

  it("throws for an empty string", () => {
    expect(() => decomposeCoverPhotoId("")).toThrow(
      /Invalid coverPhotoId format/
    )
  })

  it("returns NaN tripId for non-numeric first segment", () => {
    // The function does not validate that tripId/chapterId are numbers;
    // it just calls Number() on the segments
    const result = decomposeCoverPhotoId("abc-def-file.jpg")
    expect(result.tripId).toBeNaN()
    expect(result.chapterId).toBeNaN()
    expect(result.filename).toBe("file.jpg")
  })
})
