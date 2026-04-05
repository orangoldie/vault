"use client"

import { useRef, useEffect, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  MapPin,
  ImageIcon,
  ChevronDown,
  ArrowRight,
} from "lucide-react"

import { VaultDoor } from "./vault-door"
import { CartographicDrift } from "./cartographic-drift"
import { SiteHeader } from "./site-header"
import { ShowcaseReveal } from "./showcase-reveal"
import { SiteFooter } from "./site-footer"

// ─── Grain texture overlay ───
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  )
}

// ─── Main Landing Page ───
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95])

  const rm = prefersReducedMotion

  return (
    <main className="relative bg-vault-bg">
      <GrainOverlay />
      <SiteHeader />

      {/* ═══════════════════════════════════════════
          HERO — The sealed vault
          ═══════════════════════════════════════════ */}
      <motion.div
        ref={heroRef}
        className="relative flex min-h-svh flex-col items-center overflow-hidden"
        style={rm ? {} : { opacity: heroOpacity, scale: heroScale }}
      >
        {/* Subtle radial glow behind vault */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-[38%] size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.06] blur-[120px] md:size-[700px]" />
        </div>

        {/* Full-bleed Cartographic Drift canvas */}
        {!rm && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            aria-hidden="true"
          >
            <CartographicDrift
              scrollYProgress={scrollYProgress}
              className="w-full h-full"
            />
          </motion.div>
        )}

        {/* Reduced-motion fallback: static vault door */}
        {rm && (
          <div className="flex flex-1 items-center justify-center">
            <VaultDoor rotation={0} className="size-48 sm:size-64 md:size-80 lg:size-96" />
          </div>
        )}

        {/* Spacer — pushes text below the vault visual area */}
        {!rm && <div className="h-[70svh] shrink-0" aria-hidden="true" />}

        {/* Title + subtitle */}
        <motion.h1
          className="relative z-10 px-6 text-center font-serif text-5xl font-semibold leading-[0.95] tracking-[0.04em] text-vault-text md:text-7xl lg:text-8xl"
          initial={rm ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
        >
          Journey Vault
        </motion.h1>

        <motion.p
          className="relative z-10 mt-3 px-6 text-center text-base font-light tracking-wide text-vault-text-dim md:text-lg"
          initial={rm ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.7 }}
        >
          Your memories deserve a permanent home.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex-col items-center gap-2 hidden [@media(min-height:600px)]:flex"
          animate={rm ? {} : { y: [0, 6, 0] }}
          transition={rm ? {} : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-vault-text-dim">
            Scroll to explore
          </span>
          <ChevronDown className="size-4 text-vault-gold/50" />
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          SHOWCASE — Abstract visual + text
          ═══════════════════════════════════════════ */}
      <ShowcaseReveal reducedMotion={rm} />

      {/* ═══════════════════════════════════════════
          WHAT YOU GET — Compact feature cards
          ═══════════════════════════════════════════ */}
      <section className="px-6 pt-4 pb-14 sm:px-8 md:pt-6 md:pb-20">
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-3">
          {/* Your stories, preserved */}
          <div className="flex flex-col rounded-xl border border-vault-gold/10 bg-vault-surface/40 p-4">
            <div className="flex flex-1 flex-col justify-center rounded-lg border border-vault-gold/10 bg-gradient-to-b from-vault-surface to-vault-bg p-4">
              <div className="w-full border-l-2 border-vault-gold/15 pl-3">
                <div className="h-[4px] w-3/4 rounded-full bg-vault-gold/25" />
                <p className="mt-2 font-sans text-[10px] tracking-wide text-vault-gold/30">March 2024</p>
                <div className="mt-2.5 space-y-2">
                  {[
                    { w: "92%", o: 0.15 },
                    { w: "78%", o: 0.12 },
                    { w: "85%", o: 0.10 },
                    { w: "60%", o: 0.08 },
                  ].map((line, j) => (
                    <div
                      key={j}
                      className="h-[2px] rounded-full bg-vault-gold"
                      style={{ width: line.w, opacity: line.o }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="size-0.5 rounded-full bg-vault-gold/20" />
                  <div className="h-px flex-1 bg-vault-gold/10" />
                  <span className="text-[9px] tracking-widest text-vault-gold/30">CHAPTER 3</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-vault-gold" strokeWidth={1.8} />
              <div>
                <h3 className="font-serif text-sm font-semibold text-vault-text">Your journal</h3>
                <p className="mt-1 text-xs leading-relaxed text-vault-text-dim">
                  Your original story, preserved as it was.
                </p>
              </div>
            </div>
          </div>

          {/* Your routes, mapped */}
          <div className="flex flex-col rounded-xl border border-vault-gold/10 bg-vault-surface/40 p-4">
            <div className="flex flex-1 flex-col justify-center rounded-lg border border-vault-gold/10 bg-gradient-to-b from-vault-surface to-vault-bg p-4">
              <svg viewBox="0 0 220 80" className="w-full">
                <path
                  d="M15 60 C40 60, 45 20, 70 25 S110 55, 140 38 S175 12, 205 20"
                  fill="none"
                  stroke="hsl(32, 55%, 38%)"
                  strokeWidth="1.5"
                  strokeDasharray="3 5"
                  opacity="0.3"
                />
                {[
                  { cx: 15, cy: 60 },
                  { cx: 70, cy: 25 },
                  { cx: 140, cy: 38 },
                  { cx: 205, cy: 20 },
                ].map((pt, j) => (
                  <g key={j}>
                    <circle cx={pt.cx} cy={pt.cy} r="5" fill="none" stroke="hsl(32, 55%, 38%)" strokeWidth="1" opacity={j === 0 || j === 3 ? 0.4 : 0.25} />
                    <circle cx={pt.cx} cy={pt.cy} r="2" fill="hsl(32, 55%, 38%)" opacity={j === 0 || j === 3 ? 0.5 : 0.3} />
                  </g>
                ))}
              </svg>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="size-0.5 rounded-full bg-vault-gold/20" />
                <div className="h-px flex-1 bg-vault-gold/10" />
                <span className="text-[9px] tracking-widest text-vault-gold/30">4 STOPS</span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-vault-gold" strokeWidth={1.8} />
              <div>
                <h3 className="font-serif text-sm font-semibold text-vault-text">Your routes</h3>
                <p className="mt-1 text-xs leading-relaxed text-vault-text-dim">
                  Every path you walked, every stop you made.
                </p>
              </div>
            </div>
          </div>

          {/* Your photos, showcased */}
          <div className="flex flex-col rounded-xl border border-vault-gold/10 bg-vault-surface/40 p-4">
            <div className="flex flex-1 flex-col justify-center rounded-lg border border-vault-gold/10 bg-gradient-to-b from-vault-surface to-vault-bg p-5">
              <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
                <div className="col-span-2 row-span-2 flex aspect-[4/3] items-center justify-center rounded-md bg-gradient-to-br from-vault-gold/[0.08] to-vault-gold/[0.15]">
                  <ImageIcon className="size-5 text-vault-gold/20" />
                </div>
                <div className="aspect-square rounded-md bg-gradient-to-br from-vault-gold/[0.06] to-vault-gold/[0.12]" />
                <div className="aspect-square rounded-md bg-gradient-to-br from-vault-gold/[0.10] to-vault-gold/[0.18]" />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-vault-gold/20" />
                <div className="h-px flex-1 bg-vault-gold/10" />
                <span className="text-[9px] tracking-widest text-vault-gold/30">47 PHOTOS</span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <ImageIcon className="mt-0.5 size-4 shrink-0 text-vault-gold" strokeWidth={1.8} />
              <div>
                <h3 className="font-serif text-sm font-semibold text-vault-text">Your photos</h3>
                <p className="mt-1 text-xs leading-relaxed text-vault-text-dim">
                  Your travel photos in a beautiful album, yours to keep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Get started
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-8 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.06] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-md text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-wide text-vault-text md:text-4xl">
            Your memories are waiting
          </h2>

          <Link
            href="/import"
            className="group mt-6 inline-flex items-center gap-2.5 rounded-full bg-vault-gold px-10 py-4 text-base font-medium tracking-wide text-white shadow-md transition-all duration-300 hover:bg-vault-gold/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-vault-bg"
          >
            Get started
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
