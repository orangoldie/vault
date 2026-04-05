"use client"

import { Download, Globe, FileText } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ExportMenuProps {
  onOfflineAlbum: () => void
  onPdfAlbum: () => void
  /** "floating" = standalone circle button. "header" = text link style for the site header. */
  variant?: "floating" | "header"
}

export function ExportMenu({ onOfflineAlbum, onPdfAlbum, variant = "floating" }: ExportMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        {variant === "header" ? (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-vault-text-dim transition-colors duration-200 hover:text-vault-text focus-visible:outline-none"
          >
            <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Download
          </button>
        ) : (
          <button
            type="button"
            aria-label="Export trip"
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              "bg-vault-surface text-vault-gold shadow-md ring-1 ring-vault-gold/20",
              "transition-colors hover:bg-vault-gold hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Download className="size-5" strokeWidth={1.8} />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onClick={onOfflineAlbum} className="gap-2">
          <Globe className="size-4" />
          Offline Album
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPdfAlbum} className="gap-2">
          <FileText className="size-4" />
          PDF Album
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
