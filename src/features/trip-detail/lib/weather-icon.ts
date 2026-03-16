import type { LucideIcon } from "lucide-react"
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  Wind,
} from "lucide-react"

/**
 * Polarsteps exports use Visual Crossing weather condition strings:
 * kebab-case with optional -day/-night suffix.
 * e.g. "partly-cloudy-day", "clear-night", "rain", "snow"
 */
const WEATHER_ICONS: Record<string, LucideIcon> = {
  "clear-day": Sun,
  "clear-night": Moon,
  "partly-cloudy-day": CloudSun,
  "partly-cloudy-night": CloudMoon,
  "cloudy": Cloud,
  "overcast": Cloud,
  "rain": CloudRain,
  "showers-day": CloudRain,
  "showers-night": CloudRain,
  "thunder-rain": CloudLightning,
  "thunder-showers-day": CloudLightning,
  "thunder-showers-night": CloudLightning,
  "snow": Snowflake,
  "snow-showers-day": Snowflake,
  "snow-showers-night": Snowflake,
  "sleet": Snowflake,
  "fog": CloudFog,
  "wind": Wind,
}

export function getWeatherIcon(condition: string): LucideIcon | null {
  return WEATHER_ICONS[condition.toLowerCase()] ?? null
}
