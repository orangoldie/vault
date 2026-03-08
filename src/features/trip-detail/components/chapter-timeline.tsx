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
        <div className="relative mt-8 ml-1 before:absolute before:left-0 before:top-[10px] before:bottom-0 before:w-px before:bg-border">
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
