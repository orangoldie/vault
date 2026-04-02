import { Font } from "@react-pdf/renderer"

let registered = false

/**
 * Register fonts for PDF rendering.
 *
 * IMPORTANT: @react-pdf/renderer's fontFamily array (font stack) is broken
 * for mixed-script text — glyph IDs from one font get rendered with another
 * font's descriptor, producing garbage. Workaround: detect the dominant script
 * of each text string and assign a single fontFamily via `resolveFontFamily()`.
 */
export async function registerPdfFonts(): Promise<void> {
  if (registered) return
  registered = true

  // ── Primary fonts (Latin/Cyrillic/Greek) ──

  Font.register({
    family: "Noto Serif",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/notoserif/v33/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZqFCjwA.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/notoserif/v33/ga6iaw1J5X9T9RW6j9bNVls-hfgvz8JcMofYTa32J4wsL2JAlAhZT1ejwA.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/notoserif/v33/ga6saw1J5X9T9RW6j9bNfFIMZhhWnFTyNZIQD1-_FXP0RgnaOg9MYBNLg8cP.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  })

  Font.register({
    family: "Noto Sans",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/notosans/v42/o-0kIpQlx3QUlC5A4PNr4C5OaxRsfNNlKbCePevHtVtX57DGjDU1QDce6Vc.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  })

  // ── Script-specific fonts (each also covers Latin) ──

  const scriptFonts: Array<{ family: string; regular: string; bold: string }> = [
    {
      family: "Noto Sans Hebrew",
      regular: "https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXd4qtog.ttf",
      bold: "https://fonts.gstatic.com/s/notosanshebrew/v50/or3HQ7v33eiDljA1IufXTtVf7V6RvEEdhQlk0LlGxCyaeNKYZC0sqk3xXGiXkI2tog.ttf",
    },
    {
      family: "Noto Sans Arabic",
      regular: "https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyGyvuw.ttf",
      bold: "https://fonts.gstatic.com/s/notosansarabic/v33/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfL2uvuw.ttf",
    },
    {
      family: "Noto Sans Thai",
      regular: "https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf",
      bold: "https://fonts.gstatic.com/s/notosansthai/v29/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU3NqpzE.ttf",
    },
    {
      family: "Noto Sans JP",
      regular: "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf",
      bold: "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf",
    },
    {
      family: "Noto Sans KR",
      regular: "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzuoyeLQ.ttf",
      bold: "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf",
    },
    {
      family: "Noto Sans SC",
      regular: "https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYw.ttf",
      bold: "https://fonts.gstatic.com/s/notosanssc/v40/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaGzjCnYw.ttf",
    },
    {
      family: "Noto Sans Devanagari",
      regular: "https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlXQly-A.ttf",
      bold: "https://fonts.gstatic.com/s/notosansdevanagari/v30/TuGoUUFzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b8QQCQmHn6B2OHjbL_08AlZMiy-A.ttf",
    },
  ]

  for (const sf of scriptFonts) {
    Font.register({
      family: sf.family,
      fonts: [
        { src: sf.regular, fontWeight: 400 },
        { src: sf.regular, fontWeight: 400, fontStyle: "italic" },
        { src: sf.bold, fontWeight: 700 },
        { src: sf.bold, fontWeight: 700, fontStyle: "italic" },
      ],
    })
  }

  // ── Emoji ──

  Font.registerEmojiSource({
    format: "png",
    url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
  })

  Font.registerHyphenationCallback((word) => [word])
}

// ── Script detection + font resolution ──

type ScriptKey =
  | "hebrew"
  | "arabic"
  | "thai"
  | "cjk-jp"
  | "cjk-kr"
  | "cjk-sc"
  | "devanagari"

const SCRIPT_RANGES: Array<{ script: ScriptKey; test: (cp: number) => boolean }> = [
  { script: "hebrew", test: (cp) => cp >= 0x0590 && cp <= 0x05ff },
  { script: "arabic", test: (cp) => (cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f) || (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfeff) },
  { script: "thai", test: (cp) => cp >= 0x0e00 && cp <= 0x0e7f },
  { script: "devanagari", test: (cp) => cp >= 0x0900 && cp <= 0x097f },
  // CJK Unified + Hiragana/Katakana → JP by default
  { script: "cjk-jp", test: (cp) => (cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0xff00 && cp <= 0xffef) },
  // Hangul
  { script: "cjk-kr", test: (cp) => (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f) },
]

const SCRIPT_FONT_MAP: Record<ScriptKey, { display: string; body: string }> = {
  hebrew: { display: "Noto Sans Hebrew", body: "Noto Sans Hebrew" },
  arabic: { display: "Noto Sans Arabic", body: "Noto Sans Arabic" },
  thai: { display: "Noto Sans Thai", body: "Noto Sans Thai" },
  "cjk-jp": { display: "Noto Sans JP", body: "Noto Sans JP" },
  "cjk-kr": { display: "Noto Sans KR", body: "Noto Sans KR" },
  "cjk-sc": { display: "Noto Sans SC", body: "Noto Sans SC" },
  devanagari: { display: "Noto Sans Devanagari", body: "Noto Sans Devanagari" },
}

function detectScript(text: string): ScriptKey | null {
  for (const char of text) {
    const cp = char.codePointAt(0)!
    for (const { script, test } of SCRIPT_RANGES) {
      if (test(cp)) return script
    }
  }
  return null
}

const RTL_SCRIPTS = new Set<ScriptKey>(["hebrew", "arabic"])

// Matches emoji and other non-BMP characters (surrogate pairs in UTF-16)
const NON_BMP_RE = /[\u{10000}-\u{10FFFF}]/u

/**
 * Returns per-line text style overrides: fontFamily + direction/textAlign.
 *
 * Callers must split on \n and render each line as a separate <Text>
 * element — textkit's bidi engine breaks on newlines in RTL text.
 *
 * For RTL lines containing emoji/non-BMP characters, uses textAlign: "right"
 * instead of direction: "rtl" to avoid textkit's bidi reordering breaking
 * the emoji attachment ↔ glyph mapping.
 */
export function resolveLineStyle(
  line: string,
  variant: "display" | "body",
): { fontFamily: string; direction?: "rtl"; textAlign?: "right" } {
  const script = detectScript(line)
  const fontFamily = script
    ? SCRIPT_FONT_MAP[script][variant]
    : variant === "display" ? "Noto Serif" : "Noto Sans"

  if (script && RTL_SCRIPTS.has(script)) {
    if (NON_BMP_RE.test(line)) {
      return { fontFamily, textAlign: "right" }
    }
    return { fontFamily, direction: "rtl" }
  }
  return { fontFamily }
}

