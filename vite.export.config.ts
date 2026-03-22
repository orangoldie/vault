import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Guard rail: error on any `next/` imports that leak into the viewer bundle
    {
      name: "block-next-imports",
      enforce: "pre",
      resolveId(source) {
        if (source.startsWith("next/") || source === "next") {
          throw new Error(
            `[export-viewer] Forbidden import from "${source}". ` +
            `The viewer bundle must not depend on Next.js.`
          )
        }
        return null
      },
    },
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  publicDir: false, // Don't copy public/ into the output
  build: {
    outDir: "public/export",
    emptyOutDir: false, // Don't wipe existing files (fonts, worker)
    lib: {
      entry: path.resolve(__dirname, "src/features/export/viewer/viewer-entry.tsx"),
      name: "VaultViewer",
      fileName: () => "export-viewer.js",
      formats: ["iife"],
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: "export-viewer.[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})
