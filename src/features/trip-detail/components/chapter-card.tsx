import { formatDate, formatDateRange } from "@/lib/format-date"
import type { Chapter } from "@/types/trip"

interface ChapterCardProps {
  chapter: Chapter
}

function formatChapterDate(chapter: Chapter): string {
  if (chapter.endTime && chapter.endTime !== chapter.startTime) {
    return formatDateRange(chapter.startTime, chapter.endTime)
  }
  return formatDate(chapter.startTime)
}

function formatWeather(chapter: Chapter): string | null {
  const parts: string[] = []
  if (chapter.weatherCondition) {
    parts.push(chapter.weatherCondition)
  }
  if (chapter.weatherTemperature != null) {
    parts.push(`${Math.round(chapter.weatherTemperature)}\u00B0C`)
  }
  return parts.length > 0 ? parts.join(", ") : null
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  const weather = formatWeather(chapter)

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-accent" />

      <div className="flex flex-col gap-1">
        <h2
          dir="auto"
          className="text-lg font-semibold leading-tight text-primary"
        >
          <bdi>{chapter.displayName}</bdi>
        </h2>

        {chapter.location.detail && (
          <p className="text-sm text-muted-foreground">
            {chapter.location.detail}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          {formatChapterDate(chapter)}
        </p>

        {weather && (
          <p className="text-sm text-muted-foreground">{weather}</p>
        )}

        {chapter.description && (
          <p
            dir="auto"
            className="mt-2 whitespace-pre-line text-base leading-relaxed text-primary"
          >
            <bdi>{chapter.description}</bdi>
          </p>
        )}
      </div>
    </div>
  )
}
