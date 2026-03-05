import type { Chapter } from "@/types/trip"

import { ChapterCard } from "./chapter-card"

interface ChapterTimelineProps {
  chapters: Chapter[]
}

export function ChapterTimeline({ chapters }: ChapterTimelineProps) {
  return (
    <section aria-label="Chapter timeline">
      <div className="border-t border-border" />

      {chapters.length === 0 ? (
        <p className="py-12 text-center text-base text-muted-foreground">
          No chapters recorded for this trip.
        </p>
      ) : (
        <div className="relative mt-8 border-l border-border ml-1">
          <div className="flex flex-col gap-8 md:gap-10">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
