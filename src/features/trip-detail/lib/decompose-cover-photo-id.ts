export function decomposeCoverPhotoId(id: string): {
  tripId: number
  subdir: string
  filename: string
} {
  const first = id.indexOf("-")
  const second = id.indexOf("-", first + 1)

  if (first === -1 || second === -1) {
    throw new Error(`Invalid coverPhotoId format: "${id}"`)
  }

  return {
    tripId: Number(id.slice(0, first)),
    subdir: id.slice(first + 1, second),
    filename: id.slice(second + 1),
  }
}
