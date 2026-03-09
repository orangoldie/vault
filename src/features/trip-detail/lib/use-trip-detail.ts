"use client"

import { useState, useEffect, useCallback, useRef } from "react"

import { getTripBySlug, getChaptersByTrip, getPhotoCountsByTrip } from "@/stores/db"
import { readPhoto } from "@/stores/photo-storage"
import type { Trip, Chapter } from "@/types/trip"

import { decomposeCoverPhotoId } from "./decompose-cover-photo-id"

type TripDetailStatus = "loading" | "not-found" | "error" | "success"

interface TripDetailState {
  status: TripDetailStatus
  trip?: Trip
  chapters?: Chapter[]
  coverPhotoUrl?: string | null
  photoCountsByChapter?: Map<number, number>
}

export function useTripDetail(slug: string) {
  const [state, setState] = useState<TripDetailState>({ status: "loading" })
  const coverUrlRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    setState({ status: "loading" })

    try {
      const trip = await getTripBySlug(slug)

      if (!trip) {
        setState({ status: "not-found" })
        return
      }

      const [chapters, photoCountsByChapter] = await Promise.all([
        getChaptersByTrip(trip.id),
        getPhotoCountsByTrip(trip.id),
      ])
      const sortedChapters = [...chapters].sort(
        (a, b) => a.startTime - b.startTime
      )

      // Revoke previous object URL before creating a new one
      if (coverUrlRef.current) {
        URL.revokeObjectURL(coverUrlRef.current)
        coverUrlRef.current = null
      }

      let coverPhotoUrl: string | null = null

      if (trip.coverPhotoId) {
        try {
          const { tripId, chapterId, filename } = decomposeCoverPhotoId(
            trip.coverPhotoId
          )
          const blob = await readPhoto(tripId, chapterId, filename)
          if (blob) {
            coverPhotoUrl = URL.createObjectURL(blob)
            coverUrlRef.current = coverPhotoUrl
          }
        } catch {
          // Cover photo load failed — proceed without it
        }
      }

      setState({
        status: "success",
        trip,
        chapters: sortedChapters,
        coverPhotoUrl,
        photoCountsByChapter,
      })
    } catch {
      setState({ status: "error" })
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (coverUrlRef.current) {
        URL.revokeObjectURL(coverUrlRef.current)
      }
    }
  }, [])

  return {
    ...state,
    retry: load,
  }
}
