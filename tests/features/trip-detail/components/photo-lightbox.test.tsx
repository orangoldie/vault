import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { PhotoLightbox } from "@/features/trip-detail/components/photo-lightbox"
import type { Photo } from "@/types/trip"

// Mock framer-motion
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion")
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: ({
        children,
        className,
        onClick,
        onTouchStart,
        onTouchEnd,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <div
          className={className as string}
          onClick={onClick as React.MouseEventHandler}
          onTouchStart={onTouchStart as React.TouchEventHandler}
          onTouchEnd={onTouchEnd as React.TouchEventHandler}
          role={rest.role as string}
          aria-label={rest["aria-label"] as string}
          aria-roledescription={rest["aria-roledescription"] as string}
          tabIndex={rest.tabIndex as number}
        >
          {children}
        </div>
      ),
    },
  }
})

function makePhoto(id: string): Photo {
  return { id, tripId: 1, chapterId: 100, filename: `${id}.jpg` }
}

const photos = [makePhoto("p1"), makePhoto("p2"), makePhoto("p3")]
const urls = new Map([
  ["p1", "blob:http://localhost/p1"],
  ["p2", "blob:http://localhost/p2"],
  ["p3", "blob:http://localhost/p3"],
])

describe("PhotoLightbox", () => {
  beforeEach(() => {
    vi.spyOn(document.body.style, "overflow", "set")
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders as a dialog with correct aria attributes", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    const dialog = screen.getByRole("dialog", { name: "Photo viewer" })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute("aria-roledescription", "carousel")
  })

  it("displays the current photo", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    const img = screen.getByAltText("Photo 1 from Bangkok")
    expect(img).toHaveAttribute("src", "blob:http://localhost/p1")
  })

  it("shows chapter name and position in context bar", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={1}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    expect(screen.getByText("Bangkok — 2 of 3")).toBeInTheDocument()
  })

  it("navigates to next photo with right arrow button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    await user.click(screen.getByRole("button", { name: "Next photo" }))
    expect(screen.getByText("Bangkok — 2 of 3")).toBeInTheDocument()
  })

  it("navigates to previous photo with left arrow button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={2}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    await user.click(screen.getByRole("button", { name: "Previous photo" }))
    expect(screen.getByText("Bangkok — 2 of 3")).toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onClose = vi.fn()

    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={onClose}
      />
    )

    await user.click(
      screen.getByRole("button", { name: "Close photo viewer" })
    )
    expect(onClose).toHaveBeenCalled()
  })

  it("calls onClose on Escape key", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onClose = vi.fn()

    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={onClose}
      />
    )

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalled()
  })

  it("does not show previous button on first photo", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Previous photo" })
    ).not.toBeInTheDocument()
  })

  it("does not show next button on last photo", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={2}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    expect(
      screen.queryByRole("button", { name: "Next photo" })
    ).not.toBeInTheDocument()
  })

  it("shows a spinner when the photo URL is not available", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={new Map()}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    const spinner = document.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("has group class on container for hover-based nav visibility", () => {
    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={1}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveClass("group")
  })

  it("context bar has desktop hover classes", () => {
    const { container } = render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={0}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    // The context bar at bottom should have hover-triggered visibility on desktop
    const contextBar = container.querySelector(".md\\:group-hover\\:opacity-100")
    expect(contextBar).toBeInTheDocument()
  })

  it("preloads adjacent photos on navigation", async () => {
    const imgSpy = vi.fn()
    const OriginalImage = globalThis.Image
    // @ts-expect-error -- mock constructor
    globalThis.Image = class {
      set src(val: string) {
        imgSpy(val)
      }
    }

    render(
      <PhotoLightbox
        photos={photos}
        photoUrls={urls}
        initialIndex={1}
        chapterName="Bangkok"
        onClose={() => {}}
      />
    )

    // Should preload prev (p1) and next (p3)
    expect(imgSpy).toHaveBeenCalledWith("blob:http://localhost/p1")
    expect(imgSpy).toHaveBeenCalledWith("blob:http://localhost/p3")

    globalThis.Image = OriginalImage
  })
})
