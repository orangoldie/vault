import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock framer-motion to render plain elements
vi.mock("framer-motion", () => {
  function stripMotionProps(props: Record<string, unknown>) {
    const motionKeys = ["initial", "animate", "exit", "transition", "variants", "whileHover", "whileInView", "whileTap", "custom"]
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!motionKeys.includes(k)) cleaned[k] = v
    }
    return cleaned
  }

  return {
    motion: {
      img: (props: React.ImgHTMLAttributes<HTMLImageElement> & Record<string, unknown>) => {
        // eslint-disable-next-line @next/next/no-img-element -- test mock
        return <img {...stripMotionProps(props)} />
      },
      div: (props: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
        return <div {...stripMotionProps(props)} />
      },
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

import { HeroCover } from "@/features/trip-detail/components/hero-cover"

describe("HeroCover", () => {
  it("renders an image with the correct alt text", () => {
    render(<HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />)

    const img = screen.getByAltText("Cover photo for My Trip")
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute("src", "blob:http://test/photo")
  })

  it("returns null when coverPhotoUrl is null", () => {
    const { container } = render(
      <HeroCover coverPhotoUrl={null} tripName="My Trip" prefersReducedMotion={false} />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders the trip name as h1 after image loads", () => {
    render(<HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />)

    // Simulate image load
    const img = screen.getByAltText("Cover photo for My Trip")
    fireEvent.load(img)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("My Trip")
  })

  it("uses dir=auto and bdi for the trip name on the hero", () => {
    render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />
    )

    const img = screen.getByAltText("Cover photo for My Trip")
    fireEvent.load(img)

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveAttribute("dir", "auto")
    const bdi = heading.querySelector("bdi")
    expect(bdi).toBeInTheDocument()
  })

  it("removes the hero when image fails to load", () => {
    const { container } = render(
      <HeroCover coverPhotoUrl="blob:http://test/bad" tripName="My Trip" prefersReducedMotion={false} />
    )

    const img = screen.getByAltText("Cover photo for My Trip")
    fireEvent.error(img)

    // After error, component should return null
    expect(container.firstChild).toBeNull()
  })

  it("shows a shimmer placeholder before image loads", () => {
    const { container } = render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />
    )

    // Before load, the shimmer div with animate-pulse should be present
    const shimmer = container.querySelector(".animate-pulse")
    expect(shimmer).toBeInTheDocument()
  })

  it("hides shimmer after image loads", () => {
    const { container } = render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />
    )

    const img = screen.getByAltText("Cover photo for My Trip")
    fireEvent.load(img)

    const shimmer = container.querySelector(".animate-pulse")
    expect(shimmer).not.toBeInTheDocument()
  })

  it("does not show shimmer animation when prefersReducedMotion is true", () => {
    const { container } = render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={true} />
    )

    const shimmer = container.querySelector(".animate-pulse")
    expect(shimmer).not.toBeInTheDocument()
  })

  it("renders scroll hint after image loads", () => {
    render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />
    )

    const img = screen.getByAltText("Cover photo for My Trip")
    fireEvent.load(img)

    expect(screen.getByLabelText("Scroll to trip summary")).toBeInTheDocument()
  })

  it("does not render scroll hint before image loads", () => {
    render(
      <HeroCover coverPhotoUrl="blob:http://test/photo" tripName="My Trip" prefersReducedMotion={false} />
    )

    expect(screen.queryByLabelText("Scroll to trip summary")).not.toBeInTheDocument()
  })
})
