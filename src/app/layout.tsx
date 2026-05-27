import type { Metadata } from "next"
import { Newsreader } from "next/font/google"
import { GeistSans } from "geist/font/sans"

import { Providers } from "./providers"

import "./globals.css"

const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
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
      <body className={`${newsreader.variable} ${GeistSans.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
