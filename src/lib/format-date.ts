export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateRange(startDate: number, endDate: number): string {
  const start = new Date(startDate * 1000)
  const end = new Date(endDate * 1000)

  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  }

  const crossYear = start.getFullYear() !== end.getFullYear()

  const startStr = start.toLocaleDateString("en-US", {
    ...opts,
    year: crossYear ? "numeric" : undefined,
  })

  const endStr = end.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  })

  return `${startStr} – ${endStr}`
}

export function formatDateRangeEditorial(startDate: number, endDate: number): string {
  const start = new Date(startDate * 1000)
  const end = new Date(endDate * 1000)

  const startMonth = start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })
  const endMonth = end.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })
  const startYear = start.getUTCFullYear()
  const endYear = end.getUTCFullYear()

  if (startYear === endYear && startMonth === endMonth) {
    return `${startMonth} ${startYear}`
  }

  if (startYear === endYear) {
    return `${startMonth} – ${endMonth} ${endYear}`
  }

  return `${startMonth} ${startYear} – ${endMonth} ${endYear}`
}

export function formatTimeAgo(endDate: number): string | null {
  const now = new Date()
  const end = new Date(endDate * 1000)

  if (now.getTime() - end.getTime() < 0) return null

  const diffMonths =
    (now.getFullYear() - end.getFullYear()) * 12 +
    (now.getMonth() - end.getMonth())

  if (diffMonths < 6) return null

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (diffMonths >= 12) {
    const years = Math.round(diffMonths / 12)
    return rtf.format(-years, "year")
  }

  return rtf.format(-diffMonths, "month")
}

export function getTripDurationDays(startDate: number, endDate: number): number {
  const start = new Date(startDate * 1000)
  const end = new Date(endDate * 1000)
  start.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}
