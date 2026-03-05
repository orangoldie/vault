import { TripDetailPage } from "@/features/trip-detail/components/trip-detail-page"

interface TripPageProps {
  params: Promise<{ slug: string }>
}

export default async function TripPage({ params }: TripPageProps) {
  const { slug } = await params
  return <TripDetailPage slug={slug} />
}
