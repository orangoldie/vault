import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import type { Photo } from "@/types/trip"

// Mock framer-motion with reduced motion ENABLED
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion")
  return {
    ...actual,
    useReducedMotion: () => true,
    motion: {
      button: ({
        children,
        className,
        onClick,
        style,
        whileHover,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode }) => (
        <button
          className={className as string}
          onClick={onClick as React.MouseEventHandler}
          type="button"
          aria-label={rest["aria-label"] as string}
          aria-hidden={rest["aria-hidden"] as boolean | undefined}
          tabIndex={rest.tabIndex as number | undefined}
          data-style={JSON.stringify(style ?? null)}
          data-while-hover={JSON.stringify(whileHover ?? null)}
        >
          {children}
        </button>
      ),
    },
  }
})

import { PostcardPhoto } from "@/features/trip-detail/components/postcard-photo"

function makeProps(overrides: Partial<{
  photoId: string
  url: string | undefined
  chapterName: string
  index: number
  totalCount: number
}> = {}) {
  return {
    photoId: "photo-1",
    url: "blob:http://localhost/photo-1",
    chapterName: "Bangkok",
    index: 0,
    totalCount: 3,
    onClick: vi.fn(),
    ...overrides,
  }
}

describe("PostcardPhoto — reduced motion", () => {
  it("does not apply rotation style when reduced motion is preferred", () => {
    render(<PostcardPhoto {...makeProps()} />)

    const button = screen.getByRole("button")
    const style = button.getAttribute("data-style")
    expect(JSON.parse(style!)).toBeNull()
  })

  it("does not apply hover animation when reduced motion is preferred", () => {
    render(<PostcardPhoto {...makeProps()} />)

    const button = screen.getByRole("button")
    const whileHover = button.getAttribute("data-while-hover")
    expect(JSON.parse(whileHover!)).toBeNull()
  })

  it("still renders the photo image", () => {
    render(<PostcardPhoto {...makeProps()} />)

    const img = screen.getByAltText("Photo 1 from Bangkok")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "blob:http://localhost/photo-1")
  })

  it("renders placeholder when url is undefined", () => {
    const { container } = render(
      <PostcardPhoto {...makeProps({ url: undefined })} />
    )

    const placeholder = container.querySelector(".animate-pulse")
    expect(placeholder).toBeInTheDocument()
  })
})
