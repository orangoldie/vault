import { MapPin, ImageIcon, Route } from "lucide-react"

interface TripStatsProps {
  chapterCount: number
  photoCount: number
  totalKm: number
}

function formatDistance(km: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(km) + " km"
}

export function TripStats({ chapterCount, photoCount, totalKm }: TripStatsProps) {
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <MapPin className="size-4" />
        {chapterCount} chapters
      </span>
      <span className="flex items-center gap-1.5">
        <ImageIcon className="size-4" />
        {photoCount} photos
      </span>
      <span className="flex items-center gap-1.5">
        <Route className="size-4" />
        {formatDistance(totalKm)}
      </span>
    </div>
  )
}
