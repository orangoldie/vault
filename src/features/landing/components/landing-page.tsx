"use client"

import { useRef, useEffect, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion"
import Link from "next/link"
import { BookOpen, Download, Sparkles, ChevronDown, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { VaultDoor } from "./vault-door"

// ─── Predefined particle positions (avoids Math.random hydration mismatch) ───
const PARTICLES = [
  { x: 8, y: 18, s: 2, d: 0, dur: 19 },
  { x: 87, y: 12, s: 1.5, d: 2.5, dur: 23 },
  { x: 34, y: 74, s: 2.5, d: 5, dur: 16 },
  { x: 65, y: 42, s: 1, d: 1, dur: 26 },
  { x: 21, y: 90, s: 3, d: 7, dur: 20 },
  { x: 92, y: 58, s: 1.5, d: 4, dur: 18 },
  { x: 48, y: 28, s: 2, d: 8.5, dur: 24 },
  { x: 73, y: 85, s: 1, d: 3, dur: 21 },
  { x: 14, y: 52, s: 2.5, d: 6.5, dur: 17 },
  { x: 56, y: 8, s: 1.5, d: 9, dur: 15 },
  { x: 41, y: 96, s: 2, d: 2, dur: 25 },
  { x: 79, y: 35, s: 1, d: 5.5, dur: 19 },
  { x: 3, y: 44, s: 2.5, d: 10, dur: 22 },
  { x: 96, y: 72, s: 1.5, d: 1.5, dur: 18 },
  { x: 60, y: 62, s: 2, d: 7.5, dur: 20 },
]

// ─── Floating particle field ───
function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute animate-float-particle rounded-full bg-vault-gold"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.dur}s`,
            opacity: 0.08 + (i % 4) * 0.04,
          }}
        />
      ))}
    </div>
  )
}

// ─── Ornamental divider ───
function OrnamentalRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)} aria-hidden="true">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-vault-gold/30 md:w-20" />
      <div className="size-1.5 rotate-45 bg-vault-gold/60" />
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-vault-gold/30 md:w-20" />
    </div>
  )
}

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

// ─── Scroll-reveal wrapper ───
function Reveal({
  children,
  className,
  delay = 0,
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={disabled ? undefined : { opacity: 0, y: 32 }}
      animate={disabled ? undefined : inView ? { opacity: 1, y: 0 } : undefined}
      transition={
        disabled ? undefined : { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  )
}

// ─── "Built to last" cards data ───
const MEMORY_CARDS = [
  { label: "Travel Journal", type: "journal" as const },
  { label: "Routes & Maps", type: "route" as const },
  { label: "Photos & Moments", type: "photos" as const },
]

// ─── Solution features data ───
const SOLUTION_FEATURES = [
  {
    icon: BookOpen,
    title: "A Real Journal",
    desc: "Your stories, timelines, and chapters — preserved as you wrote them.",
  },
  {
    icon: Download,
    title: "Truly Yours",
    desc: "A permanent file you own. Browse offline, export as PDF, keep it forever.",
  },
  {
    icon: Sparkles,
    title: "Beautifully Made",
    desc: "Your memories presented as a rich, browsable travel album you'll actually want to revisit.",
  },
]

// ─── Steps data ───
const STEPS = [
  {
    num: "01",
    title: "Export your data",
    desc: "Download your travel data as a ZIP file from your travel app. It takes less than a minute.",
  },
  {
    num: "02",
    title: "Open your vault",
    desc: "Drop the file into Journey Vault. One click and your archive is ready.",
  },
  {
    num: "03",
    title: "Own your memories",
    desc: "Browse your trips with a beautiful timeline. Download as PDF. Keep your archive forever.",
  },
]

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

  const vaultRotation = useTransform(scrollYProgress, [0, 1], [0, 360])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.95])

  const rm = prefersReducedMotion

  return (
    <main className="relative bg-vault-bg">
      <GrainOverlay />

      {/* ═══════════════════════════════════════════
          HERO — The sealed vault
          ═══════════════════════════════════════════ */}
      <motion.div
        ref={heroRef}
        className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4"
        style={rm ? {} : { opacity: heroOpacity, scale: heroScale }}
      >
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.03] blur-[120px] md:size-[700px]" />
        </div>

        {!rm && <FloatingParticles />}

        {/* Vault Door */}
        <motion.div
          initial={rm ? {} : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={rm ? { duration: 0 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <VaultDoor
            rotation={rm ? 0 : vaultRotation}
            className="size-48 sm:size-64 md:size-80 lg:size-96"
          />
        </motion.div>

        <OrnamentalRule className="mt-6 md:mt-10" />

        <motion.h1
          className="mt-4 text-center font-serif text-4xl font-semibold tracking-[0.04em] text-vault-text md:text-6xl lg:text-7xl"
          initial={rm ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
        >
          Journey Vault
        </motion.h1>

        <motion.p
          className="mt-3 text-center text-base font-light tracking-wide text-vault-text-dim md:text-lg"
          initial={rm ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={rm ? { duration: 0 } : { duration: 0.8, delay: 0.5 }}
        >
          Your memories deserve a permanent home.
        </motion.p>

        {/* Scroll indicator — hidden on short viewports to prevent overlap */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 hidden [@media(min-height:600px)]:flex"
          animate={rm ? {} : { y: [0, 6, 0] }}
          transition={rm ? {} : { repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-vault-text-dim">
            Scroll to explore
          </span>
          <ChevronDown className="size-4 text-vault-gold/50" />
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          BUILT TO LAST — Your memories deserve more
          ═══════════════════════════════════════════ */}
      <section className="relative px-6 pt-12 pb-10 md:pt-16 md:pb-14">
        <div className="mx-auto max-w-3xl">
          <Reveal disabled={rm}>
            <OrnamentalRule className="mb-6" />
            <h2 className="text-center font-serif text-2xl font-semibold tracking-wide text-vault-text md:text-4xl">
              Built to last
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-vault-text-dim md:text-base">
              Your travel journals, routes, and photos deserve more than living
              inside an app. Turn them into something permanent.
            </p>
          </Reveal>

          {/* Memory type cards */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {MEMORY_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                className="overflow-hidden rounded-xl border border-vault-gold/10 bg-vault-surface p-6"
                initial={rm ? {} : { opacity: 0, y: 24 }}
                whileInView={rm ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <p className="mb-4 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-vault-gold/60">
                  {card.label}
                </p>

                {/* Decorative card content */}
                {card.type === "journal" && (
                  <div className="space-y-2.5">
                    {[82, 70, 55, 40].map((w, j) => (
                      <div
                        key={j}
                        className="h-2 rounded-sm bg-vault-gold/[0.07]"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                )}
                {card.type === "route" && (
                  <svg viewBox="0 0 200 80" className="w-full">
                    <path
                      d="M10 60 Q50 10, 100 40 T190 20"
                      fill="none"
                      stroke="hsl(40, 72%, 52%)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.15"
                    />
                    <circle cx="10" cy="60" r="4" fill="hsl(40, 72%, 52%)" opacity="0.2" />
                    <circle cx="190" cy="20" r="4" fill="hsl(40, 72%, 52%)" opacity="0.2" />
                  </svg>
                )}
                {card.type === "photos" && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="aspect-square rounded-sm bg-vault-gold/[0.07]" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <Reveal delay={0.4} disabled={rm}>
            <p className="mt-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-vault-text-dim/70">
              One file. Yours forever.
            </p>
          </Reveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SOLUTION — The vault opens
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 pt-10 pb-10 md:pt-14 md:pb-14">
        {/* Warm radial glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.02] blur-[120px] md:size-[900px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <Reveal disabled={rm}>
            <OrnamentalRule className="mb-6" />
            <h2 className="text-center font-serif text-2xl font-semibold tracking-wide text-vault-text md:text-4xl">
              A vault that opens only for you
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-vault-text-dim md:text-base">
              Import your travel data and get a beautiful, permanent archive
              you can keep, browse, and share.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SOLUTION_FEATURES.map((item, i) => (
              <Reveal key={item.title} delay={0.1 + i * 0.12} disabled={rm}>
                <div className="rounded-xl border border-vault-gold/10 bg-vault-surface/50 p-6 text-center backdrop-blur-sm">
                  <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full border border-vault-gold/20 bg-vault-gold/[0.08]">
                    <item.icon className="size-5 text-vault-gold" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-vault-text">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-vault-text-dim">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          HOW IT WORKS — Three turns of the key
          ═══════════════════════════════════════════ */}
      <section className="px-6 pt-10 pb-10 md:pt-14 md:pb-14">
        <div className="mx-auto max-w-xl">
          <Reveal disabled={rm}>
            <OrnamentalRule className="mb-6" />
            <h2 className="text-center font-serif text-2xl font-semibold tracking-wide text-vault-text md:text-4xl">
              Three turns of the key
            </h2>
          </Reveal>

          <div className="mt-10 flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.15} disabled={rm}>
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-vault-gold/25 bg-vault-gold/[0.08] font-serif text-sm font-semibold text-vault-gold">
                      {step.num}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="mt-2 h-full w-px bg-gradient-to-b from-vault-gold/20 to-transparent" />
                    )}
                  </div>
                  <div className="pb-1">
                    <h3 className="font-serif text-lg font-semibold text-vault-text md:text-xl">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-vault-text-dim">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Open your vault
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.03] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-md text-center">
          <Reveal disabled={rm}>
            <OrnamentalRule className="mb-6" />
            <h2 className="font-serif text-2xl font-semibold tracking-wide text-vault-text md:text-4xl">
              Your memories are waiting
            </h2>

            <Link
              href="/import"
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-vault-gold px-8 py-3.5 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-300 hover:bg-vault-gold/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-vault-bg"
            >
              Open Your Vault
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <p className="mt-5 text-[0.65rem] tracking-wide text-vault-text-dim/50">
              Works with any travel app data export
            </p>
          </Reveal>
        </div>

        <OrnamentalRule className="mt-12" />

        {/* Footer */}
        <p className="mt-8 text-center text-[0.6rem] tracking-wider text-vault-text-dim/30">
          Journey Vault
        </p>
      </section>
    </main>
  )
}
