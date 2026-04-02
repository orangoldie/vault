import { Page, View, Text, StyleSheet } from "@react-pdf/renderer"

import type { Trip } from "@/types/trip"
import { formatDateRangeEditorial, getTripDurationDays } from "@/lib/format-date"

import { pdfTheme } from "../lib/pdf-theme"
import { resolveLineStyle } from "../lib/pdf-fonts"
import { PageNumber } from "./page-number"
import { countryCodeToFlagEmoji } from "../lib/country-flag-emoji"

const t = pdfTheme

const styles = StyleSheet.create({
  page: {
    padding: t.spacing.pageMargin,
    backgroundColor: t.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: t.fonts.display,
    fontSize: t.sizes.summaryTitle,
    color: t.colors.primary,
    textAlign: "center",
  },
  dateRange: {
    fontFamily: t.fonts.body,
    fontSize: 14,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
  rule: {
    width: 60,
    height: 1,
    backgroundColor: t.colors.accent,
    marginTop: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontFamily: t.fonts.display,
    fontSize: 20,
    fontWeight: 700,
    color: t.colors.primary,
  },
  statLabel: {
    fontFamily: t.fonts.body,
    fontSize: t.sizes.caption,
    color: t.colors.muted,
    marginTop: 2,
  },
  flagRoute: {
    fontFamily: t.fonts.body,
    fontSize: 36,
    color: t.colors.muted,
    textAlign: "center",
    marginTop: 16,
  },
  summary: {
    fontFamily: t.fonts.display,
    fontStyle: "italic",
    fontSize: 14,
    color: t.colors.primary,
    textAlign: "center",
    marginTop: 16,
    maxWidth: 500,
  },
})

interface SummaryPageProps {
  trip: Trip
  chapterCount: number
  photoCount: number
  countryCodes: string[]
}

export function SummaryPage({
  trip,
  chapterCount,
  photoCount,
  countryCodes,
}: SummaryPageProps) {
  const dateRange = formatDateRangeEditorial(trip.startDate, trip.endDate)
  const days = getTripDurationDays(trip.startDate, trip.endDate)
  const distanceKm = Math.round(trip.totalKm)
  const flagRoute = countryCodes.map(countryCodeToFlagEmoji).join("  ")

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={[styles.title, resolveLineStyle(trip.name, "display")]}>{trip.name}</Text>
      <Text style={styles.dateRange}>{dateRange}</Text>
      <View style={styles.rule} />

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{days}</Text>
          <Text style={styles.statLabel}>days</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {distanceKm.toLocaleString("en-US")}
          </Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{photoCount}</Text>
          <Text style={styles.statLabel}>photos</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{chapterCount}</Text>
          <Text style={styles.statLabel}>chapters</Text>
        </View>
      </View>

      {flagRoute && <Text style={styles.flagRoute} wrap>{flagRoute}</Text>}

      {trip.summary && (
        <View>
          {trip.summary.split("\n").map((line, i) => (
            <Text
              key={i}
              style={[styles.summary, resolveLineStyle(line, "display")]}
            >
              {line || " "}
            </Text>
          ))}
        </View>
      )}

      <PageNumber />
    </Page>
  )
}
