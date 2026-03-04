"use client"

import { useRef } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ImportPromptProps {
  onFileSelected: (file: File) => void
}

export function ImportPrompt({ onFileSelected }: ImportPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
      // Reset so the same file can be re-selected
      e.target.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary">
          Journey Vault
        </h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-[1.125rem] font-medium leading-[1.4] tracking-[-0.01em] text-primary">
          Your travels, your archive.
        </p>
        <p className="max-w-[340px] text-base leading-[1.5] text-muted-foreground">
          Import your travel data export and turn it into a beautiful travel
          album.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={handleClick}
          className="h-11 gap-1 px-6 text-base font-medium shadow-sm"
        >
          <Upload className="size-5" />
          Import Trip
        </Button>
        <p className="text-xs leading-[1.5] tracking-[0.01em] text-muted-foreground">
          Select your travel export ZIP file
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleChange}
        className="hidden"
        aria-label="Select travel export ZIP file"
      />
    </div>
  )
}
