import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

interface TripDetailErrorProps {
  onRetry: () => void
}

export function TripDetailError({ onRetry }: TripDetailErrorProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-12 text-warning" strokeWidth={1.5} />
      <h1 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary">
        Something went wrong
      </h1>
      <p className="text-base text-muted-foreground">
        We couldn&apos;t load this trip. This might be a temporary issue.
      </p>
      <Button onClick={onRetry} className="mt-2 h-11 px-6">
        Try Again
      </Button>
    </div>
  )
}
