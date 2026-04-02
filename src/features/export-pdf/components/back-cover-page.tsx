import { Page, View, Text, StyleSheet } from "@react-pdf/renderer"

import { pdfTheme } from "../lib/pdf-theme"

const t = pdfTheme

const styles = StyleSheet.create({
  page: {
    backgroundColor: t.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  rule: {
    width: 40,
    height: 1,
    backgroundColor: t.colors.accent,
    marginBottom: 12,
  },
  text: {
    fontFamily: t.fonts.body,
    fontSize: t.sizes.caption,
    color: t.colors.muted,
  },
})

export function BackCoverPage() {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.rule} />
      <Text style={styles.text}>Made with Journey Vault</Text>
    </Page>
  )
}
