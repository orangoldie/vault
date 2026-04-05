"use client"

import { useRef } from "react"
import { Route, Globe } from "lucide-react"

import { cn } from "@/lib/utils"

// Source names appear here as the single UI exception permitted by the spec.
// All other import page copy uses generic language only.

export type ImportSource = "primary"

interface SourcePickerProps {
  selected: ImportSource | null
  onSelect: (source: ImportSource) => void
}

export function SourcePicker({ selected, onSelect }: SourcePickerProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const secondaryRef = useRef<HTMLButtonElement>(null)
  const isPrimarySelected = selected === "primary"

  function handlePrimaryKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      secondaryRef.current?.focus()
    }
  }

  function handleSecondaryKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      primaryRef.current?.focus()
    }
  }

  return (
    <div role="radiogroup" aria-label="Select data source">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Polarsteps — selectable */}
        <button
          ref={primaryRef}
          type="button"
          role="radio"
          aria-checked={isPrimarySelected}
          aria-label="Polarsteps"
          tabIndex={0}
          onClick={() => onSelect("primary")}
          onKeyDown={handlePrimaryKeyDown}
          className={cn(
            "rounded-2xl border p-5 text-left transition-all duration-200",
            isPrimarySelected
              ? "border-vault-gold/60 bg-vault-gold/[0.04] ring-2 ring-vault-gold/20"
              : "border-vault-gold/20 bg-vault-surface hover:border-vault-gold/35",
          )}
        >
          <Route
            className={cn(
              "size-8",
              isPrimarySelected ? "text-vault-gold/80" : "text-vault-gold/60",
            )}
            strokeWidth={1.5}
          />
          <p className="mt-3 font-serif text-base font-semibold text-vault-text">
            Polarsteps
          </p>
        </button>

        {/* FindPenguins — coming soon. Uses aria-disabled (not disabled) so it
            remains focusable via arrow-key navigation within the radiogroup. */}
        <button
          ref={secondaryRef}
          type="button"
          role="radio"
          aria-checked={false}
          aria-disabled="true"
          aria-label="FindPenguins, coming soon"
          tabIndex={-1}
          onKeyDown={handleSecondaryKeyDown}
          className="cursor-not-allowed rounded-2xl border border-vault-gold/10 bg-vault-surface/50 p-5 text-left opacity-60"
        >
          <Globe
            className="size-8 text-vault-text-dim/40"
            strokeWidth={1.5}
          />
          <p className="mt-3 font-serif text-base font-semibold text-vault-text-dim">
            FindPenguins{" "}
            <span className="inline-flex items-center rounded-full bg-vault-gold/10 px-2 py-0.5 text-xs font-medium text-vault-gold/70">
              Coming soon
            </span>
          </p>
        </button>
      </div>
    </div>
  )
}
