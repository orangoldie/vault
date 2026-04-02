/**
 * Convert an ISO 3166-1 alpha-2 country code to its flag emoji.
 * Each letter is offset into the Regional Indicator Symbol range (U+1F1E6–U+1F1FF).
 */
export function countryCodeToFlagEmoji(code: string): string {
  const upper = code.toUpperCase()
  if (upper.length !== 2) return code
  const offset = 0x1f1e6 - 65 // 'A' = 65
  return String.fromCodePoint(
    upper.charCodeAt(0) + offset,
    upper.charCodeAt(1) + offset
  )
}
