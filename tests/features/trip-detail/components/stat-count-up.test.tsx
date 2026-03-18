import { describe, it, expect, vi } from "vitest"
import { render, act } from "@testing-library/react"

import { StatCountUp } from "@/features/trip-detail/components/stat-count-up"

describe("StatCountUp", () => {
  it("renders final value immediately when prefersReducedMotion is true", () => {
    const { container } = render(
      <StatCountUp value={42} prefersReducedMotion={true} />
    )
    expect(container.textContent).toBe("42")
  })

  it("renders formatted final value immediately when prefersReducedMotion is true", () => {
    const { container } = render(
      <StatCountUp value={1234} prefersReducedMotion={true} />
    )
    expect(container.textContent).toBe("1,234")
  })

  it("starts at 0 when prefersReducedMotion is false", () => {
    const { container } = render(
      <StatCountUp value={100} prefersReducedMotion={false} />
    )
    expect(container.textContent).toBe("0")
  })

  it("renders final value immediately when paused and reduced motion", () => {
    const { container } = render(
      <StatCountUp value={50} prefersReducedMotion={true} paused={true} />
    )
    expect(container.textContent).toBe("50")
  })

  it("stays at 0 when paused and animation enabled", () => {
    const { container } = render(
      <StatCountUp value={100} prefersReducedMotion={false} paused={true} />
    )
    expect(container.textContent).toBe("0")
  })

  it("animates to final value when unpaused", () => {
    // Collect rAF callbacks so we can flush them manually
    const callbacks: FrameRequestCallback[] = []
    const originalRaf = globalThis.requestAnimationFrame
    const originalCaf = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      callbacks.push(cb)
      return callbacks.length
    }
    globalThis.cancelAnimationFrame = () => {}

    try {
      const { container, rerender } = render(
        <StatCountUp value={100} duration={1000} prefersReducedMotion={false} paused={true} />
      )
      expect(container.textContent).toBe("0")

      // Unpause — this triggers the useEffect which calls rAF
      act(() => {
        rerender(
          <StatCountUp value={100} duration={1000} prefersReducedMotion={false} paused={false} />
        )
      })

      // Flush all queued rAF callbacks inside act() so React processes state updates
      act(() => {
        let safety = 0
        while (callbacks.length > 0 && safety < 100) {
          const cb = callbacks.shift()!
          cb(safety === 0 ? 0 : 2000)
          safety++
        }
      })

      expect(container.textContent).toBe("100")
    } finally {
      globalThis.requestAnimationFrame = originalRaf
      globalThis.cancelAnimationFrame = originalCaf
    }
  })

  it("renders 0 for value of 0", () => {
    const { container } = render(
      <StatCountUp value={0} prefersReducedMotion={true} />
    )
    expect(container.textContent).toBe("0")
  })
})
