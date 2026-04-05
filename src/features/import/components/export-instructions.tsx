"use client"

import { useRef, useState } from "react"
import { Upload, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

// The external link points to the official export guide for the primary travel app.
const EXPORT_GUIDE_URL =
  "https://support.polarsteps.com/hc/en-us/articles/24266264821138-How-can-I-export-a-copy-of-my-data"

interface ExportInstructionsProps {
  onFileSelected: (file: File) => void
}

export function ExportInstructions({ onFileSelected }: ExportInstructionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  function handleButtonClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
      e.target.value = ""
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the zone entirely (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <section
      aria-label="Export instructions"
      className="mt-6 rounded-2xl border border-vault-gold/20 bg-vault-gold/[0.03] p-6 md:p-8"
    >
      <p className="text-sm leading-relaxed text-vault-text-dim">
        Export your data from{" "}
        <a
          href={EXPORT_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-vault-text underline underline-offset-2 decoration-vault-gold/40 transition-colors hover:decoration-vault-gold/70 inline-flex items-center gap-0.5"
        >
          Polarsteps
          <ExternalLink className="size-3 text-vault-gold/50" aria-hidden="true" />
        </a>
        , then upload the ZIP file below.
      </p>

      {/* Upload zone */}
      <div
        role="region"
        aria-label="File upload area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "mt-6 rounded-xl border-2 border-dashed py-8 text-center transition-colors duration-200",
          isDragOver
            ? "border-vault-gold/60 bg-vault-gold/[0.04]"
            : "border-vault-gold/25 bg-vault-bg/50",
        )}
      >
        <Upload
          className="mx-auto mb-3 size-8 text-vault-gold/50"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-vault-text">
          Drop your ZIP file here
        </p>
        <p className="mt-1 text-xs text-vault-text-dim">or</p>
        <button
          onClick={handleButtonClick}
          className="mt-3 rounded-full bg-vault-gold px-6 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-vault-gold/90"
        >
          Select file
        </button>
        <p className="mt-3 text-xs text-vault-text-dim/60">Accepts .zip files</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleChange}
        className="hidden"
        aria-label="Select travel export ZIP file"
      />
    </section>
  )
}
