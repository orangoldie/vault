"use client"

import { Download } from "lucide-react"

import { cn } from "@/lib/utils"

interface ExportButtonProps {
  onClick: () => void
  className?: string
}

export function ExportButton({ onClick, className }: ExportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Export trip as offline archive"
      title="Export"
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "text-muted-foreground transition-colors hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Download className="size-5" strokeWidth={1.8} />
      <span className="hidden sm:inline">Export</span>
    </button>
  )
}
