"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { MiniVault } from "./mini-vault"

interface SiteHeaderProps {
  /** Replaces the default "Get started" link. Pass `null` to render nothing. */
  rightSlot?: React.ReactNode
  /**
   * When provided, overrides the internal scroll-based visibility entirely.
   * The header fades in/out based on this value and always uses the opaque
   * background when visible. Use on pages that control visibility externally
   * (e.g. trip page, where the header should appear together with the globe
   * and chapter sidebar once the summary section has scrolled out of view).
   */
  visible?: boolean
}

export function SiteHeader({ rightSlot, visible: visibleProp }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 0)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // When caller controls visibility externally, use their value.
  // Otherwise fall back to the standard scroll-based behaviour.
  const controlled = visibleProp !== undefined
  const visible = controlled ? visibleProp : true

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 z-40 w-full transition-[background-color,border-color,opacity] duration-200 ease-out",
        !visible && "opacity-0 pointer-events-none",
        controlled
          ? "border-b border-vault-gold/10 bg-vault-bg/80 backdrop-blur-md"
          : scrolled
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

        {/* Right slot — defaults to "Get started" link */}
        {rightSlot !== undefined ? rightSlot : (
          <Link
            href="/import"
            className="text-sm font-medium tracking-wide text-vault-text-dim transition-colors duration-200 hover:text-vault-text"
          >
            Get started
          </Link>
        )}
      </div>
    </header>
  )
}
