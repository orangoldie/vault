import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"

import {
  usePhotoSource,
  PhotoSourceProvider,
  type PhotoSource,
} from "@/features/trip-detail/lib/photo-source-context"

describe("PhotoSourceContext", () => {
  it("returns a no-op source by default", async () => {
    const { result } = renderHook(() => usePhotoSource())

    const photos = await result.current.getPhotos(1)
    expect(photos).toEqual([])

    const url = await result.current.resolveUrl({
      id: "x",
      tripId: 1,
      chapterId: 1,
      filename: "test.jpg",
    })
    expect(url).toBeNull()

    // revokeUrl should not throw
    expect(() => result.current.revokeUrl("anything")).not.toThrow()
  })

  it("returns the provided source when wrapped in PhotoSourceProvider", async () => {
    const mockSource: PhotoSource = {
      getPhotos: vi.fn().mockResolvedValue([{ id: "p1" }]),
      resolveUrl: vi.fn().mockResolvedValue("blob:url"),
      revokeUrl: vi.fn(),
    }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <PhotoSourceProvider source={mockSource}>{children}</PhotoSourceProvider>
    )

    const { result } = renderHook(() => usePhotoSource(), { wrapper })

    const photos = await result.current.getPhotos(42)
    expect(mockSource.getPhotos).toHaveBeenCalledWith(42)
    expect(photos).toEqual([{ id: "p1" }])
  })
})
