import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock framer-motion
vi.mock("framer-motion", () => {
  function stripMotionProps(props: Record<string, unknown>) {
    const motionKeys = [
      "initial", "animate", "exit", "transition", "variants",
      "whileHover", "whileInView", "whileTap", "custom",
    ]
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(props)) {
      if (!motionKeys.includes(k)) cleaned[k] = v
    }
    return cleaned
  }

  return {
    motion: {
      span: (props: Record<string, unknown>) => {
        const { children, ...rest } = stripMotionProps(props)
        return <span {...rest}>{children as React.ReactNode}</span>
      },
    },
    useInView: () => true,
  }
})

// Mock tooltip — render children directly, include TooltipProvider
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock country-flag
vi.mock("@/lib/country-flag", () => ({
  countryFlagClass: (code: string) => {
    const lower = code.toLowerCase()
    if (lower.length !== 2) return ""
    return `fi fi-${lower} fis`
  },
}))

import { CountryRoute } from "@/features/trip-detail/components/country-route"

describe("CountryRoute", () => {
  it("returns null for empty country codes", () => {
    const { container } = render(
      <CountryRoute countryCodes={[]} prefersReducedMotion={true} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders single country with flag and name", () => {
    render(<CountryRoute countryCodes={["JP"]} prefersReducedMotion={true} />)
    // Should show country name inline
    expect(screen.getByText("Japan", { selector: ".font-medium" })).toBeInTheDocument()
    // Should have the route aria-label
    expect(screen.getByLabelText("Route: Japan")).toBeInTheDocument()
    // No arrows
    expect(screen.queryByText("→")).not.toBeInTheDocument()
    // Tooltip shows the name too
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("Japan")
  })

  it("renders 2-5 countries with flags, names, and arrows", () => {
    render(
      <CountryRoute
        countryCodes={["IL", "TH", "VN"]}
        prefersReducedMotion={true}
      />
    )
    // Inline country names
    expect(screen.getByText("Israel", { selector: ".font-medium" })).toBeInTheDocument()
    expect(screen.getByText("Thailand", { selector: ".font-medium" })).toBeInTheDocument()
    expect(screen.getByText("Vietnam", { selector: ".font-medium" })).toBeInTheDocument()
    // 2 arrows for 3 countries
    expect(screen.getAllByText("→")).toHaveLength(2)
    expect(screen.getByLabelText("Route: Israel, Thailand, Vietnam")).toBeInTheDocument()
  })

  it("renders 6-10 countries with flags only (no inline names), tooltips available", () => {
    const codes = ["IL", "TH", "LA", "VN", "TW", "CN"]
    render(
      <CountryRoute countryCodes={codes} prefersReducedMotion={true} />
    )
    // Should NOT show country names inline (no .font-medium spans)
    expect(screen.queryByText("Israel", { selector: ".font-medium" })).not.toBeInTheDocument()
    expect(screen.queryByText("Thailand", { selector: ".font-medium" })).not.toBeInTheDocument()
    // But tooltip content renders for each flag
    expect(screen.getAllByTestId("tooltip-content")).toHaveLength(6)
    // Arrows present
    expect(screen.getAllByText("→")).toHaveLength(5)
    // Full route in aria-label
    expect(
      screen.getByLabelText("Route: Israel, Thailand, Laos, Vietnam, Taiwan, China")
    ).toBeInTheDocument()
  })

  it("renders 11+ countries in condensed format", () => {
    const codes = [
      "IL", "TH", "LA", "VN", "TW", "CN", "KH", "MM", "MY", "SG", "ID",
    ]
    render(
      <CountryRoute countryCodes={codes} prefersReducedMotion={true} />
    )
    // Shows "N countries" label
    expect(screen.getByText("· 11 countries")).toBeInTheDocument()
    // Shows ellipsis
    expect(screen.getByText("…")).toBeInTheDocument()
    // Full route in aria-label regardless of truncation
    expect(screen.getByLabelText(/Route:/)).toBeInTheDocument()
  })

  it("renders flag elements with correct CSS classes", () => {
    const { container } = render(
      <CountryRoute countryCodes={["JP"]} prefersReducedMotion={true} />
    )
    const flag = container.querySelector(".fi.fi-jp.fis")
    expect(flag).toBeInTheDocument()
  })
})
