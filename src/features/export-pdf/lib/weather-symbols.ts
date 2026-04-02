/**
 * Weather condition -> emoji for PDF rendering.
 * We append U+FE0F (variation selector 16) to force emoji presentation,
 * ensuring embedEmojis in @react-pdf/layout matches them via emoji-regex
 * and renders them as Twemoji images rather than relying on font glyphs.
 */
const VS16 = "\uFE0F"

const WEATHER_SYMBOLS: Record<string, string> = {
  "clear-day": `\u2600${VS16}`,       // ☀️
  "clear-night": `\u263E${VS16}`,     // ☾️
  "partly-cloudy-day": `\u26C5${VS16}`, // ⛅️
  "partly-cloudy-night": `\u2601${VS16}`, // ☁️
  "cloudy": `\u2601${VS16}`,          // ☁️
  "overcast": `\u2601${VS16}`,        // ☁️
  "rain": `\u2602${VS16}`,            // ☂️
  "showers-day": `\u2602${VS16}`,     // ☂️
  "showers-night": `\u2602${VS16}`,   // ☂️
  "thunder-rain": `\u26C8${VS16}`,    // ⛈️
  "thunder-showers-day": `\u26C8${VS16}`,
  "thunder-showers-night": `\u26C8${VS16}`,
  "snow": `\u2744${VS16}`,            // ❄️
  "snow-showers-day": `\u2744${VS16}`,
  "snow-showers-night": `\u2744${VS16}`,
  "sleet": `\u2744${VS16}`,
  "fog": `\u2601${VS16}`,             // ☁️ (fog uses cloud — █ has no emoji form)
  "wind": `\uD83C\uDF2C${VS16}`,      // 🌬️ (wind face emoji — ☴ has no emoji form)
}

export function getWeatherSymbol(condition: string): string | null {
  return WEATHER_SYMBOLS[condition.toLowerCase()] ?? null
}
