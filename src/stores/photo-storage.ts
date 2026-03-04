let photosRootPromise: Promise<FileSystemDirectoryHandle> | null = null

function getPhotosRoot(): Promise<FileSystemDirectoryHandle> {
  if (!photosRootPromise) {
    photosRootPromise = navigator.storage
      .getDirectory()
      .then((root) => root.getDirectoryHandle("photos", { create: true }))
  }
  return photosRootPromise
}

async function getOrCreateDir(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true })
}

export async function writePhoto(
  tripId: number,
  chapterId: number,
  filename: string,
  data: Uint8Array
): Promise<void> {
  const root = await getPhotosRoot()
  const tripDir = await getOrCreateDir(root, String(tripId))
  const chapterDir = await getOrCreateDir(tripDir, String(chapterId))
  const fileHandle = await chapterDir.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()
}

export async function readPhoto(
  tripId: number,
  chapterId: number,
  filename: string
): Promise<Blob | null> {
  try {
    const root = await getPhotosRoot()
    const tripDir = await root.getDirectoryHandle(String(tripId))
    const chapterDir = await tripDir.getDirectoryHandle(String(chapterId))
    const fileHandle = await chapterDir.getFileHandle(filename)
    return await fileHandle.getFile()
  } catch {
    return null
  }
}

export async function deletePhotosByTrip(tripId: number): Promise<void> {
  try {
    const root = await getPhotosRoot()
    await root.removeEntry(String(tripId), { recursive: true })
  } catch {
    // Directory may not exist — that's fine
  }
}

export async function deletePhotoFiles(
  photos: Array<{ tripId: number; chapterId: number; filename: string }>
): Promise<void> {
  const root = await getPhotosRoot()
  for (const { tripId, chapterId, filename } of photos) {
    try {
      const tripDir = await root.getDirectoryHandle(String(tripId))
      const chapterDir = await tripDir.getDirectoryHandle(String(chapterId))
      await chapterDir.removeEntry(filename)
    } catch {
      // File may already be gone — that's fine
    }
  }
}

/** Reset the cached root handle for testing */
export function resetPhotosRoot(): void {
  photosRootPromise = null
}
