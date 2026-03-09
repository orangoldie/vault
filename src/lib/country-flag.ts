/**
 * Convert an ISO 3166-1 alpha-2 country code to its flag-icons CSS class.
 * Returns empty string for invalid codes.
 */
export function countryFlagClass(countryCode: string): string {
  const code = countryCode.toLowerCase()
  if (code.length !== 2) return ""
  return `fi fi-${code} fis`
}
