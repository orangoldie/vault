"use client"

import { Download, Globe } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ExportMenu({ onOfflineAlbum }: { onOfflineAlbum: () => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onClick={onOfflineAlbum} className="gap-2">
          <Globe className="size-4" />
          Offline Album
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
