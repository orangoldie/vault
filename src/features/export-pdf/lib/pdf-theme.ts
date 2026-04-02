/** PDF-specific theme constants — mirrors vault aesthetic, adapted for print. */
export const pdfTheme = {
  colors: {
    primary: "#5c5550",
    muted: "#8a8078",
    background: "#faf8f5",
    surface: "#e8e1d4",
    accent: "#b8965a",
    white: "#ffffff",
  },
  fonts: {
    /** Default display font (Latin/Cyrillic/Greek). For non-Latin, use resolveFontFamily(). */
    display: "Noto Serif",
    /** Default body font (Latin/Cyrillic/Greek). For non-Latin, use resolveFontFamily(). */
    body: "Noto Sans",
  },
  sizes: {
    coverTitle: 48,
    chapterTitle: 28,
    summaryTitle: 32,
    body: 12,
    caption: 10,
    meta: 11,
    pageNumber: 9,
  },
  /** Line heights as multipliers of font size (e.g. 1.5 = 150%). */
  lineHeights: {
    chapterTitle: 1.3,
    meta: 1.4,
    body: 1.5,
  },
  spacing: {
    /** Page margin in points (12mm) */
    pageMargin: 34,
    /** Gutter between photos in points (3mm) */
    photoGutter: 8.5,
    /** Vertical gap between chapter text block and photos below */
    textToPhotos: 16,
    /** Gap between two text columns */
    columnGap: 20,
  },
  /** Text layout metrics for height estimation. */
  text: {
    /** Word count threshold above which description switches to two columns. */
    twoColumnThreshold: 150,
  },
  page: {
    width: 841.89,  // A4 landscape width in points (297mm)
    height: 595.28, // A4 landscape height in points (210mm)
  },
  /** Photo layout constraints. */
  photo: {
    /** Minimum photo width or height in points. Also used as Zone A skip threshold. */
    minDimension: 120,
    /** Minimum photos per page during distribution (unless only page for chapter). */
    minPhotosPerPage: 2,
    /** Maximum area a photo may lose to cover-fit cropping (0–1). */
    maxCropRatio: 0.25,
  },
} as const

// ── Derived layout constants ────────────────────────────────
// Single source of truth for values computed from the theme.

/** Usable content width inside page margins. */
export const contentWidth = pdfTheme.page.width - pdfTheme.spacing.pageMargin * 2

/** Usable content height inside page margins. */
export const fullPageHeight = pdfTheme.page.height - pdfTheme.spacing.pageMargin * 2

/** Height consumed by title + meta line (before description). */
export const titleMetaHeight =
  pdfTheme.sizes.chapterTitle * pdfTheme.lineHeights.chapterTitle +
  pdfTheme.sizes.meta * pdfTheme.lineHeights.meta +
  6 // meta marginTop

/** Margin above description block (used in styles and measurement). */
export const descriptionMarginTop = 12
