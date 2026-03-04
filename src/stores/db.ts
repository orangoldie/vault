import { openDB, type IDBPDatabase } from "idb"

import type { Trip, Chapter, Photo } from "@/types/trip"

import { deletePhotosByTrip } from "@/stores/photo-storage"

const DB_NAME = "journey-vault"
const DB_VERSION = 2

interface VaultDB {
  trips: {
    key: number
    value: Trip
  }
  chapters: {
    key: number
    value: Chapter
    indexes: {
      tripId: number
    }
  }
  photos: {
    key: string
    value: Photo
    indexes: {
      tripId: number
      chapterId: number
    }
  }
}

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null

function getDb(): Promise<IDBPDatabase<VaultDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VaultDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("trips", { keyPath: "id" })

          const chapterStore = db.createObjectStore("chapters", { keyPath: "id" })
          chapterStore.createIndex("tripId", "tripId")

          const photoStore = db.createObjectStore("photos", { keyPath: "id" })
          photoStore.createIndex("tripId", "tripId")
          photoStore.createIndex("chapterId", "chapterId")
        }

        if (oldVersion >= 1 && oldVersion < 2) {
          // Drop and recreate photos store without blob field
          db.deleteObjectStore("photos")
          const photoStore = db.createObjectStore("photos", { keyPath: "id" })
          photoStore.createIndex("tripId", "tripId")
          photoStore.createIndex("chapterId", "chapterId")
        }
      },
    })
  }
  return dbPromise
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = await getDb()
  await db.put("trips", trip)
}

export async function saveChapters(chapters: Chapter[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction("chapters", "readwrite")
  for (const chapter of chapters) {
    await tx.store.put(chapter)
  }
  await tx.done
}

export async function savePhoto(photo: Photo): Promise<void> {
  const db = await getDb()
  await db.put("photos", photo)
}

export async function getTrip(id: number): Promise<Trip | undefined> {
  const db = await getDb()
  return db.get("trips", id)
}

export async function getAllTrips(): Promise<Trip[]> {
  const db = await getDb()
  return db.getAll("trips")
}

export async function getChaptersByTrip(tripId: number): Promise<Chapter[]> {
  const db = await getDb()
  return db.getAllFromIndex("chapters", "tripId", tripId)
}

export async function getPhotosByTrip(tripId: number): Promise<string[]> {
  const db = await getDb()
  return db.getAllKeysFromIndex("photos", "tripId", tripId) as Promise<string[]>
}

export async function getPhotosByIds(ids: string[]): Promise<Photo[]> {
  if (ids.length === 0) return []
  const db = await getDb()
  const results: Photo[] = []
  for (const id of ids) {
    const photo = await db.get("photos", id)
    if (photo) results.push(photo)
  }
  return results
}

export async function deleteTrip(id: number): Promise<void> {
  const db = await getDb()

  const chapterKeys = await db.getAllKeysFromIndex("chapters", "tripId", id)
  const photoKeys = await db.getAllKeysFromIndex("photos", "tripId", id)

  const tx = db.transaction(["trips", "chapters", "photos"], "readwrite")
  await tx.objectStore("trips").delete(id)
  for (const key of chapterKeys) {
    await tx.objectStore("chapters").delete(key)
  }
  for (const key of photoKeys) {
    await tx.objectStore("photos").delete(key)
  }
  await tx.done

  // Remove OPFS photo files for this trip
  await deletePhotosByTrip(id)
}

export async function deletePhotos(photoIds: string[]): Promise<void> {
  if (photoIds.length === 0) return
  const db = await getDb()
  const tx = db.transaction("photos", "readwrite")
  for (const id of photoIds) {
    await tx.store.delete(id)
  }
  await tx.done
}

/** Reset the singleton for testing */
export function resetDb(): void {
  dbPromise = null
}
