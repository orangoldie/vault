/**
 * Convert an ISO 3166-1 alpha-2 country code to its flag emoji.
 * Each letter is offset into the Regional Indicator Symbol range (U+1F1E6–U+1F1FF).
 */
export function countryCodeToFlag(countryCode: string): string {
  const code = countryCode.toUpperCase()
  if (code.length !== 2) return ""
  const offset = 0x1f1e6 - 65 // 'A' = 65
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset)
}
