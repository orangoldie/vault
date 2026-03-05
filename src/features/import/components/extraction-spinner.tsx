import { Loader2 } from "lucide-react"

export function ExtractionSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-base text-muted-foreground">
        Reading your travel data&hellip;
      </p>
    </div>
  )
}
