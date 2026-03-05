"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

interface ReimportConfirmationProps {
  onCancel: () => void
  onConfirm: () => void
}

export function ReimportConfirmation({ onCancel, onConfirm }: ReimportConfirmationProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-sm text-muted-foreground">
        This trip is already in your vault. Import again to update it?
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          ref={cancelRef}
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
        >
          Import
        </Button>
      </div>
    </div>
  )
}
