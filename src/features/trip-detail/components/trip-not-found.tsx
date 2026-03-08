import Link from "next/link"

import { Button } from "@/components/ui/button"

export function TripNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-[1.875rem] font-semibold leading-[1.2] tracking-[-0.02em] text-primary">
        Trip not found
      </h1>
      <p className="text-base text-muted-foreground">
        This trip doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild variant="outline" className="mt-2 h-11 px-6">
        <Link href="/import">Back to your trips</Link>
      </Button>
    </div>
  )
}
