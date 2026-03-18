import type { Chapter } from "@/types/trip"

export function getCountryRoute(chapters: Chapter[]): string[] {
  const seen = new Set<string>()
  const route: string[] = []
  for (const chapter of chapters) {
    const code = chapter.location.countryCode
    if (code && !seen.has(code)) {
      seen.add(code)
      route.push(code)
    }
  }
  return route
}
