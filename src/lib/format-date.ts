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
