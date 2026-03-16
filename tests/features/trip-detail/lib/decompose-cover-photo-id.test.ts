import { describe, it, expect } from "vitest"

import { decomposeCoverPhotoId } from "@/features/trip-detail/lib/decompose-cover-photo-id"

describe("decomposeCoverPhotoId", () => {
  it("splits a chapter-based coverPhotoId into tripId, subdir, and filename", () => {
    const result = decomposeCoverPhotoId("1-2-photo.jpg")
    expect(result).toEqual({
      tripId: 1,
      subdir: "2",
      filename: "photo.jpg",
    })
  })

  it("handles the cover subdir for S3-downloaded covers", () => {
    const result = decomposeCoverPhotoId("23101407-cover-cover.jpg")
    expect(result).toEqual({
      tripId: 23101407,
      subdir: "cover",
      filename: "cover.jpg",
    })
  })

  it("handles filenames with hyphens", () => {
    const result = decomposeCoverPhotoId("1-2-photo-2025-01-01.jpg")
    expect(result).toEqual({
      tripId: 1,
      subdir: "2",
      filename: "photo-2025-01-01.jpg",
    })
  })

  it("handles filenames with multiple dots", () => {
    const result = decomposeCoverPhotoId("10-200-my.photo.file.png")
    expect(result).toEqual({
      tripId: 10,
      subdir: "200",
      filename: "my.photo.file.png",
    })
  })

  it("handles large numeric IDs", () => {
    const result = decomposeCoverPhotoId("999999-888888-image.webp")
    expect(result).toEqual({
      tripId: 999999,
      subdir: "888888",
      filename: "image.webp",
    })
  })

  it("handles filename with only hyphens", () => {
    const result = decomposeCoverPhotoId("1-2----.jpg")
    expect(result).toEqual({
      tripId: 1,
      subdir: "2",
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
})
