"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

interface BackButtonProps {
  hasCover: boolean
}

export function BackButton({ hasCover }: BackButtonProps) {
  return (
    <nav aria-label="Back navigation" className="fixed left-4 top-4 z-30">
      <Link
        href="/import"
        aria-label="Back to trip list"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "min-h-11 min-w-11",
          hasCover
            ? "bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
            : "bg-surface text-primary shadow-sm hover:bg-surface-hover"
        )}
      >
        <ArrowLeft className="size-4" />
        <span className="hidden md:inline">Back</span>
      </Link>
    </nav>
  )
}
