export function decomposeCoverPhotoId(id: string): {
  tripId: number
  chapterId: number
  filename: string
} {
  const first = id.indexOf("-")
  const second = id.indexOf("-", first + 1)

  if (first === -1 || second === -1) {
    throw new Error(`Invalid coverPhotoId format: "${id}"`)
  }

  return {
    tripId: Number(id.slice(0, first)),
    chapterId: Number(id.slice(first + 1, second)),
    filename: id.slice(second + 1),
  }
}
