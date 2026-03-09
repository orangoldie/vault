import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { PostcardGrid } from "@/features/trip-detail/components/postcard-grid"
import type { Photo } from "@/types/trip"

// Mock framer-motion
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion")
  return {
    ...actual,
    useReducedMotion: () => false,
    motion: {
      button: ({
        children,
        className,
        onClick,
        style,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <button
          className={className as string}
          onClick={onClick as React.MouseEventHandler}
          type="button"
          aria-label={rest["aria-label"] as string}
          aria-hidden={rest["aria-hidden"] as boolean | undefined}
          tabIndex={rest.tabIndex as number | undefined}
        >
          {children}
        </button>
      ),
    },
  }
})

function makePhoto(id: string, chapterId = 100): Photo {
  return { id, tripId: 1, chapterId, filename: `${id}.jpg` }
}

describe("PostcardGrid", () => {
  it("renders nothing when photos array is empty", () => {
    const { container } = render(
      <PostcardGrid
        photos={[]}
        photoUrls={new Map()}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders a single centered postcard for 1 photo", () => {
    const photos = [makePhoto("p1")]
    const urls = new Map([["p1", "blob:http://localhost/p1"]])

    render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    expect(
      screen.getByRole("button", { name: "Photo 1 from Bangkok" })
    ).toBeInTheDocument()
  })

  it("renders fanned-out layout for 2-4 photos with overlap", () => {
    const photos = [makePhoto("p1"), makePhoto("p2"), makePhoto("p3")]
    const urls = new Map([
      ["p1", "blob:1"],
      ["p2", "blob:2"],
      ["p3", "blob:3"],
    ])

    const { container } = render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(3)

    // The container should use negative space for overlap
    const wrapper = container.querySelector(".-space-x-4")
    expect(wrapper).toBeInTheDocument()
  })

  it("renders staggered grid for 5-12 photos", () => {
    const photos = Array.from({ length: 6 }, (_, i) => makePhoto(`p${i}`))
    const urls = new Map(photos.map((p) => [p.id, `blob:${p.id}`]))

    const { container } = render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(6)

    // Should use grid layout
    const grid = container.querySelector(".grid")
    expect(grid).toBeInTheDocument()
  })

  it("renders flowing grid for 13+ photos", () => {
    const photos = Array.from({ length: 15 }, (_, i) => makePhoto(`p${i}`))
    const urls = new Map(photos.map((p) => [p.id, `blob:${p.id}`]))

    const { container } = render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(15)

    const grid = container.querySelector(".grid")
    expect(grid).toBeInTheDocument()
  })

  it("renders placeholder grid from photoCount when photos array is empty", () => {
    const { container } = render(
      <PostcardGrid
        photos={[]}
        photoUrls={new Map()}
        photoCount={6}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    // Should render a grid with 6 placeholder cards
    const grid = container.querySelector(".grid")
    expect(grid).toBeInTheDocument()

    const placeholders = container.querySelectorAll(".animate-pulse")
    expect(placeholders).toHaveLength(6)
  })

  it("renders nothing when both photos and photoCount are zero", () => {
    const { container } = render(
      <PostcardGrid
        photos={[]}
        photoUrls={new Map()}
        photoCount={0}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it("uses photos.length for layout when photos are loaded", () => {
    const photos = Array.from({ length: 6 }, (_, i) => makePhoto(`p${i}`))
    const urls = new Map(photos.map((p) => [p.id, `blob:${p.id}`]))

    render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        photoCount={6}
        chapterName="Bangkok"
        onPhotoClick={() => {}}
      />
    )

    // Should render real PostcardPhoto buttons, not placeholders
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(6)
  })

  it("calls onPhotoClick with correct index when a photo is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event")
    const user = userEvent.setup()
    const onPhotoClick = vi.fn()

    const photos = [makePhoto("p1"), makePhoto("p2")]
    const urls = new Map([
      ["p1", "blob:1"],
      ["p2", "blob:2"],
    ])

    render(
      <PostcardGrid
        photos={photos}
        photoUrls={urls}
        chapterName="Bangkok"
        onPhotoClick={onPhotoClick}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Photo 2 from Bangkok" })
    )
    expect(onPhotoClick).toHaveBeenCalledWith(1)
  })
})
