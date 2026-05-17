const UNSAFE_CHARS = /[\/\\:*?"<>|]+/g
const WHITESPACE_AND_SEPARATORS = /[\s\-_]+/g
const LEADING_TRAILING_DASHES = /^-+|-+$/g
const NAME_CAP = 50

/**
 * Derives a human-readable export filename slug from the trip name and start date.
 * Format: {name-slug}-{YYYY-MM}, e.g. "japan-highlights-2024-03" or "מסע-לאירופה-2024-03"
 * Supports non-Latin scripts. Falls back to Polarsteps slug if name yields nothing.
 */
export function deriveExportSlug(
  name: string,
  startDate: number,
  fallbackSlug: string
): string {
  const date = new Date(startDate * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const suffix = `-${year}-${month}`

  const namePart = name
    .trim()
    .replace(UNSAFE_CHARS, "")
    .replace(WHITESPACE_AND_SEPARATORS, "-")
    .replace(LEADING_TRAILING_DASHES, "")
    .slice(0, NAME_CAP)
    .replace(LEADING_TRAILING_DASHES, "")

  const base = namePart.length > 0 ? namePart : fallbackSlug

  return `${base}${suffix}`
}
