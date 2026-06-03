import React from "react"
import { Document } from "@react-pdf/renderer"

import type { Trip } from "@/types/trip"
import type { PageContent } from "../lib/plan-photo-layouts"
import type { FontMetrics } from "../lib/measure-text"

import { CoverPage } from "./cover-page"
import { SummaryPage } from "./summary-page"
import {
  ContentPage,
  detectDescriptionRtl,
  getTextColumnPages,
  TextContinuationPage,
} from "./photo-spread-page"
import { BackCoverPage } from "./back-cover-page"

export interface ChapterSection {
  pages: PageContent[]
  /** Pre-resolved data URLs keyed by photo filename. */
  dataUrlsByFilename: Map<string, string | null>
}

interface TripAlbumDocumentProps {
  trip: Trip
  coverPhotoDataUrl: string | null
  countryCodes: string[]
  chapterCount: number
  photoCount: number
  sections: ChapterSection[]
  fontMetrics: FontMetrics
}

export function TripAlbumDocument({
  trip,
  coverPhotoDataUrl,
  countryCodes,
  chapterCount,
  photoCount,
  sections,
  fontMetrics,
}: TripAlbumDocumentProps) {
  // Pre-compute all content pages as a flat array — react-pdf doesn't handle nested arrays
  const contentPages: React.ReactElement[] = []
  let globalPageIdx = 0
  for (const section of sections) {
    for (let pageIndex = 0; pageIndex < section.pages.length; pageIndex++) {
      const page = section.pages[pageIndex]

      // For two-column chapters, compute all column pages once (single source of truth)
      let firstPageColumns: [string[], string[]] | undefined
      if (page.chapterHeader?.useTwoColumns && page.chapterHeader.chapter.description) {
        const allColumnPages = getTextColumnPages(page.chapterHeader.chapter, fontMetrics)
        firstPageColumns = allColumnPages[0]
        const hasContinuation = allColumnPages.length > 1

        // If text overflows to continuation pages, don't put photos on this page —
        // they'll be emitted on subsequent pages after all text continuations
        contentPages.push(
          <ContentPage
            key={`cp-${globalPageIdx++}`}
            chapterHeader={{ ...page.chapterHeader, firstPageColumns }}
            photos={hasContinuation ? [] : page.photos}
            photoDataUrls={hasContinuation ? [] : page.photos.map(
              (box) => section.dataUrlsByFilename.get(box.photo.filename) ?? null
            )}
          />
        )

        if (hasContinuation) {
          const descRtl = detectDescriptionRtl(page.chapterHeader.chapter.description)

          // The planner places any combine-photo page immediately after the header
          // page; it carries continuationTextHeight to mark the below-text strip.
          const nextPage = pageIndex + 1 < section.pages.length ? section.pages[pageIndex + 1] : null
          const combinePhotos = nextPage?.continuationTextHeight !== undefined

          // Continuation pages — all except possibly the last (which may combine with photos)
          const lastContIdx = allColumnPages.length - 1
          for (let ci = 1; ci < allColumnPages.length; ci++) {
            const [col1, col2] = allColumnPages[ci]
            const isLastCont = ci === lastContIdx

            if (isLastCont && combinePhotos && nextPage) {
              // Combine last continuation text + photos on the same page
              contentPages.push(
                <TextContinuationPage
                  key={`cp-${globalPageIdx++}`}
                  col1={col1}
                  col2={col2}
                  isRtl={descRtl}
                  photos={nextPage.photos}
                  photoDataUrls={nextPage.photos.map(
                    (box) => section.dataUrlsByFilename.get(box.photo.filename) ?? null
                  )}
                />
              )
            } else {
              contentPages.push(
                <TextContinuationPage
                  key={`cp-${globalPageIdx++}`}
                  col1={col1}
                  col2={col2}
                  isRtl={descRtl}
                />
              )
            }
          }

          // The combine page was consumed above; skip it in the outer loop.
          if (combinePhotos) pageIndex++
        }
      } else {
        contentPages.push(
          <ContentPage
            key={`cp-${globalPageIdx++}`}
            chapterHeader={page.chapterHeader}
            photos={page.photos}
            photoDataUrls={page.photos.map(
              (box) => section.dataUrlsByFilename.get(box.photo.filename) ?? null
            )}
          />
        )
      }
    }
  }

  return (
    <Document
      title={`${trip.name} — Travel Album`}
      author="Journey Vault"
      creator="Journey Vault"
    >
      <CoverPage
        trip={trip}
        coverPhotoDataUrl={coverPhotoDataUrl}
        countryCodes={countryCodes}
      />

      <SummaryPage
        trip={trip}
        chapterCount={chapterCount}
        photoCount={photoCount}
        countryCodes={countryCodes}
      />

      {contentPages}

      <BackCoverPage />
    </Document>
  )
}
