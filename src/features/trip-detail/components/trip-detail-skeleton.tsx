"use client"

import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"

function Shimmer({ className }: { className?: string }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div
      className={cn(
        "rounded bg-muted",
        !prefersReducedMotion && "animate-pulse",
        className
      )}
    />
  )
}

export function TripDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero shimmer */}
      <Shimmer className="aspect-[16/9] w-full rounded-none" />

      {/* Header shimmer */}
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 md:px-8">
        <Shimmer className="h-5 w-48" />
        <Shimmer className="h-4 w-full max-w-[400px]" />
        <Shimmer className="h-4 w-full max-w-[320px]" />
        <div className="flex gap-4">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-4 w-24" />
        </div>
      </div>

      {/* Timeline shimmer */}
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 md:px-8">
        <Shimmer className="h-px w-full" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 pl-4">
            <Shimmer className="mt-1.5 size-2.5 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-4 w-full max-w-[300px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
