/**
 * Downloads Google Fonts WOFF2 variable font files for self-hosted use in the export.
 * Downloads ALL unicode subsets so the exported trip renders text in any language.
 * Places them in public/export/fonts/.
 *
 * Run: pnpm build:export-fonts
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.resolve(__dirname, "../public/export/fonts")

const FONTS = [
  {
    family: "Cormorant",
    // Variable font CSS URL — full weight range, normal + italic
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700;1,300..700&display=swap",
    prefix: "cormorant",
  },
  {
    family: "Outfit",
    cssUrl:
      "https://fonts.googleapis.com/css2?family=Outfit:wght@300..700&display=swap",
    prefix: "outfit",
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

  for (const block of blocks) {
    const urlMatch = block.match(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/
    )
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

async function downloadFont(font: (typeof FONTS)[number]): Promise<void> {
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

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Check if fonts CSS already exists (skip if so)
  const allExist = FONTS.every((f) =>
    fs.existsSync(path.join(OUTPUT_DIR, `${f.prefix}.css`))
  )
  if (allExist) {
    console.log("Export fonts already downloaded, skipping.")
    return
  }

  // Clean old single-file fonts
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    fs.rmSync(path.join(OUTPUT_DIR, f))
  }

  console.log("Downloading export fonts (all subsets)...")
  for (const font of FONTS) {
    await downloadFont(font)
  }
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
  console.error("Failed to download export fonts:", err)
  process.exit(1)
})
