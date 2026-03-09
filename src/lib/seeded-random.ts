/**
 * Simple seeded random number generator based on a string key.
 * Returns a stable value in [0, 1) for the same input.
 */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  // Convert to a positive float in [0, 1)
  return (((hash >>> 0) % 10000) / 10000)
}
