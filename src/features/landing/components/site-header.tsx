"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { MiniVault } from "./mini-vault"

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 z-40 w-full transition-[background-color,border-color] duration-200 ease-out",
        scrolled
          ? "border-b border-vault-gold/10 bg-vault-bg/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 sm:px-8">
        {/* Logo + wordmark */}
        <Link href="/" className="flex items-center gap-2.5">
          <MiniVault />
          <span className="font-serif text-base font-semibold tracking-wide text-vault-text">
            Journey Vault
          </span>
        </Link>

        {/* CTA link */}
        <Link
          href="/import"
          className="text-sm font-medium tracking-wide text-vault-text-dim transition-colors duration-200 hover:text-vault-text"
        >
          Get started
        </Link>
      </div>
    </header>
  )
}
