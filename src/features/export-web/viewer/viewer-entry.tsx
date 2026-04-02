import "@/app/globals.css"

import { createRoot } from "react-dom/client"

import { ExportViewer } from "./export-viewer"

const container = document.getElementById("vault-root")
if (container) {
  const root = createRoot(container)
  root.render(<ExportViewer />)
}
