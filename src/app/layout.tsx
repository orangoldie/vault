import type { Metadata } from "next"
import { Cormorant, Outfit } from "next/font/google"

import "./globals.css"

const cormorant = Cormorant({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
})

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
})

export const metadata: Metadata = {
  title: "Journey Vault",
  description: "Your travels, your archive. Preserve and browse your travel memories.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
