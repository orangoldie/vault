/**
 * Prepares fonts for self-hosted use in the offline HTML export:
 * - Downloads Newsreader from Google Fonts (WOFF2 variable font, all subsets)
 * - Copies Geist Sans variable font from node_modules
 *
 * PDF export uses Noto fonts registered from Google Fonts CDN at runtime (see pdf-fonts.ts).
 *
 * Places them in public/export/fonts/.
 *
 * Run: pnpm build:export-fonts
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.resolve(__dirname, "../public/export/fonts")

const GOOGLE_FONTS = [
  {
    family: "Newsreader",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&display=swap",
    prefix: "newsreader",
  },
]

const WOFF2_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

interface FontFace {
  url: string
  unicodeRange: string
  weight: string
  style: string
}

function parseFontFaces(css: string): FontFace[] {
  const faces: FontFace[] = []
  const blocks = css.split("@font-face")
  const urlPattern = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/

  for (const block of blocks) {
    const urlMatch = block.match(urlPattern)
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/)
    const weightMatch = block.match(/font-weight:\s*([^;]+);/)
    const styleMatch = block.match(/font-style:\s*([^;]+);/)

    if (urlMatch) {
      faces.push({
        url: urlMatch[1],
        unicodeRange: rangeMatch?.[1]?.trim() ?? "",
        weight: weightMatch?.[1]?.trim() ?? "400",
        style: styleMatch?.[1]?.trim() ?? "normal",
      })
    }
  }
  return faces
}

async function downloadGoogleFont(
  font: (typeof GOOGLE_FONTS)[number]
): Promise<void> {
  console.log(`\n  Downloading ${font.family}...`)

  const cssResponse = await fetch(font.cssUrl, {
    headers: { "User-Agent": WOFF2_USER_AGENT },
  })
  const css = await cssResponse.text()
  const faces = parseFontFaces(css)

  console.log(`    Found ${faces.length} font-face blocks`)

  // Download each WOFF2 file and generate @font-face CSS
  let fontFaceCss = ""
  let totalSize = 0

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i]
    const filename = `${font.prefix}-${i}.woff2`
    const outPath = path.join(OUTPUT_DIR, filename)

    const fontResponse = await fetch(face.url)
    const buffer = Buffer.from(await fontResponse.arrayBuffer())
    fs.writeFileSync(outPath, buffer)
    totalSize += buffer.length

    fontFaceCss += `@font-face {
  font-family: '${font.family}';
  src: url('./${filename}') format('woff2');
  font-weight: ${face.weight};
  font-style: ${face.style};
  font-display: swap;
  unicode-range: ${face.unicodeRange};
}\n`
  }

  // Write the CSS file for this font family
  const cssPath = path.join(OUTPUT_DIR, `${font.prefix}.css`)
  fs.writeFileSync(cssPath, fontFaceCss, "utf-8")

  console.log(
    `    ${faces.length} files, ${(totalSize / 1024).toFixed(0)} KB total`
  )
}

function copyGeistSans(): void {
  console.log(`\n  Copying Geist Sans from node_modules...`)

  const srcPath = path.resolve(
    __dirname,
    "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2"
  )
  const destPath = path.join(OUTPUT_DIR, "geist-sans.woff2")

  fs.copyFileSync(srcPath, destPath)
  const size = fs.statSync(destPath).size

  const css = `@font-face {
  font-family: 'Geist Sans';
  src: url('./geist-sans.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`
  fs.writeFileSync(path.join(OUTPUT_DIR, "geist-sans.css"), css, "utf-8")

  console.log(`    1 file, ${(size / 1024).toFixed(0)} KB total`)
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Check if fonts CSS already exists (skip if so)
  const alreadyExist =
    fs.existsSync(path.join(OUTPUT_DIR, "newsreader.css")) &&
    fs.existsSync(path.join(OUTPUT_DIR, "geist-sans.css"))

  if (alreadyExist) {
    console.log("Export fonts already downloaded, skipping.")
    return
  }

  // Clean old fonts before re-download
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    fs.rmSync(path.join(OUTPUT_DIR, f))
  }

  console.log("Preparing export fonts (all subsets)...")

  for (const font of GOOGLE_FONTS) {
    await downloadGoogleFont(font)
  }

  copyGeistSans()

  // Write manifest listing all files in the fonts directory
  const allFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f !== "manifest.json")
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(allFiles, null, 2),
    "utf-8"
  )
  console.log(`\nManifest: ${allFiles.length} files`)
  console.log("Done.")
}

main().catch((err) => {
  console.error("Failed to prepare export fonts:", err)
  process.exit(1)
})
