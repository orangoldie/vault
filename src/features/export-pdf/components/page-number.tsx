import { Text, StyleSheet } from "@react-pdf/renderer"

import { pdfTheme } from "../lib/pdf-theme"

const styles = StyleSheet.create({
  pageNumber: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: pdfTheme.fonts.body,
    fontSize: pdfTheme.sizes.pageNumber,
    color: pdfTheme.colors.muted,
  },
})

export function PageNumber() {
  return (
    <Text
      style={styles.pageNumber}
      fixed
      render={({ pageNumber, totalPages }) =>
        pageNumber > 1 ? `${pageNumber} / ${totalPages}` : ""
      }
    />
  )
}
