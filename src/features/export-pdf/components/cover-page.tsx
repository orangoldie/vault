import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"

import type { Trip } from "@/types/trip"
import { formatDateRangeEditorial } from "@/lib/format-date"

import { pdfTheme } from "../lib/pdf-theme"
import { resolveLineStyle } from "../lib/pdf-fonts"
import { countryCodeToFlagEmoji } from "../lib/country-flag-emoji"

const styles = StyleSheet.create({
  page: {
    width: pdfTheme.page.width,
    height: pdfTheme.page.height,
    position: "relative",
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "#00000059",
  },
  textContainer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    fontFamily: pdfTheme.fonts.display,
    fontSize: pdfTheme.sizes.coverTitle,
    color: pdfTheme.colors.white,
    textAlign: "center",
  },
  dateRange: {
    fontFamily: pdfTheme.fonts.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 6,
  },
  flagRoute: {
    fontFamily: pdfTheme.fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  // Fallback (no cover photo)
  fallbackPage: {
    width: pdfTheme.page.width,
    height: pdfTheme.page.height,
    backgroundColor: pdfTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackTitle: {
    fontFamily: pdfTheme.fonts.display,
    fontSize: pdfTheme.sizes.coverTitle,
    color: pdfTheme.colors.primary,
    textAlign: "center",
  },
  fallbackDate: {
    fontFamily: pdfTheme.fonts.body,
    fontSize: 14,
    color: pdfTheme.colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
  fallbackFlags: {
    fontFamily: pdfTheme.fonts.body,
    fontSize: 12,
    color: pdfTheme.colors.muted,
    textAlign: "center",
    marginTop: 4,
  },
})

interface CoverPageProps {
  trip: Trip
  coverPhotoDataUrl: string | null
  countryCodes: string[]
}

export function CoverPage({ trip, coverPhotoDataUrl, countryCodes }: CoverPageProps) {
  const dateRange = formatDateRangeEditorial(trip.startDate, trip.endDate)
  const flagRoute = countryCodes.map(countryCodeToFlagEmoji).join("  ")

  if (!coverPhotoDataUrl) {
    return (
      <Page size="A4" orientation="landscape" style={styles.fallbackPage}>
        <Text style={[styles.fallbackTitle, resolveLineStyle(trip.name, "display")]}>{trip.name}</Text>
        <Text style={styles.fallbackDate}>{dateRange}</Text>
        {flagRoute && <Text style={styles.fallbackFlags}>{flagRoute}</Text>}
      </Page>
    )
  }

  return (
    <Page size="A4" orientation="landscape" style={{ padding: 0 }} wrap={false}>
      <View style={{ width: pdfTheme.page.width, height: pdfTheme.page.height, position: "relative" }}>
        <Image src={coverPhotoDataUrl} style={styles.coverImage} />
        <View style={styles.gradient} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, resolveLineStyle(trip.name, "display")]}>{trip.name}</Text>
          <Text style={styles.dateRange}>{dateRange}</Text>
        </View>
      </View>
    </Page>
  )
}
