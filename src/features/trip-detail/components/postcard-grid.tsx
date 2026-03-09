"use client"

import type { Photo } from "@/types/trip"

import { PostcardPhoto } from "./postcard-photo"

interface PostcardGridProps {
  photos: Photo[]
  photoUrls: Map<string, string>
  photoCount?: number
  chapterName: string
  onPhotoClick: (index: number) => void
}

export function PostcardGrid({
  photos,
  photoUrls,
  photoCount = 0,
  chapterName,
  onPhotoClick,
}: PostcardGridProps) {
  const count = photos.length > 0 ? photos.length : photoCount
  if (count === 0) return null

  function renderCard(index: number) {
    const photo = photos[index]
    return (
      <PostcardPhoto
        photoId={photo?.id ?? `placeholder-${index}`}
        url={photo ? photoUrls.get(photo.id) : undefined}
        chapterName={chapterName}
        index={index}
        totalCount={count}
        onClick={photo ? () => onPhotoClick(index) : undefined}
      />
    )
  }

  function itemKey(index: number) {
    return photos[index]?.id ?? `ph-${index}`
  }

  // Single photo: centered, no rotation
  if (count === 1) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="w-48 md:w-56">{renderCard(0)}</div>
      </div>
    )
  }

  // 2–4 photos: "tossed on table" — fanned out with tighter overlap
  if (count <= 4) {
    return (
      <div className="mt-8 flex flex-wrap justify-center -space-x-4 md:-space-x-6">
        {Array.from({ length: count }, (_, i) => (
          <div key={itemKey(i)} className="w-40 shrink-0 md:w-48">
            {renderCard(i)}
          </div>
        ))}
      </div>
    )
  }

  // 5–12 photos: two staggered rows with slight overlap
  if (count <= 12) {
    return (
      <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-0 md:grid-cols-3 md:gap-x-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={itemKey(i)}
            className={i % 2 === 1 ? "mt-4 -mb-2 md:mt-6 md:-mb-3" : "-mb-2 md:-mb-3"}
          >
            {renderCard(i)}
          </div>
        ))}
      </div>
    )
  }

  // 13+ photos: flowing rows with minimal overlap
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-0 md:grid-cols-3 md:gap-x-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={itemKey(i)} className="-mb-1 md:-mb-2">
          {renderCard(i)}
        </div>
      ))}
    </div>
  )
}
