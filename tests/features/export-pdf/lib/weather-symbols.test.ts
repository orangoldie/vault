import { describe, it, expect } from "vitest"

import { getWeatherSymbol } from "@/features/export-pdf/lib/weather-symbols"

describe("getWeatherSymbol", () => {
  it("returns sun symbol for clear-day", () => {
    expect(getWeatherSymbol("clear-day")).toBe("\u2600\uFE0F")
  })

  it("returns snowflake for snow", () => {
    expect(getWeatherSymbol("snow")).toBe("\u2744\uFE0F")
  })

  it("is case-insensitive", () => {
    expect(getWeatherSymbol("RAIN")).toBe("\u2602\uFE0F")
    expect(getWeatherSymbol("Clear-Day")).toBe("\u2600\uFE0F")
  })

  it("returns null for unknown conditions", () => {
    expect(getWeatherSymbol("tornado")).toBeNull()
    expect(getWeatherSymbol("")).toBeNull()
  })

  it("handles all day/night variants", () => {
    expect(getWeatherSymbol("partly-cloudy-day")).not.toBeNull()
    expect(getWeatherSymbol("partly-cloudy-night")).not.toBeNull()
    expect(getWeatherSymbol("showers-day")).not.toBeNull()
    expect(getWeatherSymbol("showers-night")).not.toBeNull()
    expect(getWeatherSymbol("thunder-showers-day")).not.toBeNull()
    expect(getWeatherSymbol("snow-showers-day")).not.toBeNull()
  })
})
