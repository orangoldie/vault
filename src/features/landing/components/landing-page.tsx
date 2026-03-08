"use client"

import { useRef, useEffect, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  MapPin,
  ImageIcon,
  Shield,
  ChevronDown,
  ArrowRight,
} from "lucide-react"

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

// ─── Value proposition data ───
const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: "Your stories, preserved",
    desc: "Journal entries, timelines, and chapters — kept exactly as you wrote them.",
    visual: "journal" as const,
  },
  {
    icon: MapPin,
    title: "Your routes, mapped",
    desc: "Every path you walked, every stop you made. Your routes rendered as a beautiful visual record of where you've been.",
    visual: "route" as const,
  },
  {
    icon: ImageIcon,
    title: "Your photos, showcased",
    desc: "Your travel photos presented as a rich, browsable album you can keep forever.",
    visual: "photos" as const,
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

// ─── Trust signals ───
const TRUST_SIGNALS = [
  { icon: Shield, text: "100% private — your data never leaves your browser" },
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
            opacity: 0.12 + (i % 4) * 0.06,
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
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-vault-gold/40 md:w-20" />
      <div className="size-1.5 rotate-45 bg-vault-gold/80" />
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-vault-gold/40 md:w-20" />
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

// ─── Visual illustrations for value prop rows ───
function JournalVisual() {
  return (
    <div className="rounded-2xl border border-vault-gold/15 bg-gradient-to-b from-vault-surface to-vault-bg p-7">
      <div className="border-l-2 border-vault-gold/15 pl-5">
        <div className="h-[5px] w-3/4 rounded-full bg-vault-gold/25" />
        <p className="mt-3 font-sans text-xs tracking-wide text-vault-gold/30">March 2024</p>
        <div className="mt-4 space-y-3">
          {[
            { w: "92%", o: 0.15 },
            { w: "78%", o: 0.12 },
            { w: "85%", o: 0.10 },
            { w: "60%", o: 0.08 },
            { w: "70%", o: 0.06 },
          ].map((line, j) => (
            <div
              key={j}
              className="h-[3px] rounded-full bg-vault-gold"
              style={{ width: line.w, opacity: line.o }}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <div className="size-1 rounded-full bg-vault-gold/20" />
          <div className="h-px flex-1 bg-vault-gold/10" />
          <span className="text-xs tracking-widest text-vault-gold/30">
            CHAPTER 3
          </span>
        </div>
      </div>
    </div>
  )
}

function RouteVisual() {
  return (
    <div className="rounded-2xl border border-vault-gold/15 bg-gradient-to-b from-vault-surface to-vault-bg p-7">
      <svg viewBox="0 0 220 100" className="w-full">
        <path
          d="M15 75 C40 75, 45 25, 70 30 S110 70, 140 45 S175 15, 205 25"
          fill="none"
          stroke="hsl(32, 55%, 38%)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity="0.3"
        />
        {[
          { cx: 15, cy: 75 },
          { cx: 70, cy: 30 },
          { cx: 140, cy: 45 },
          { cx: 205, cy: 25 },
        ].map((pt, j) => (
          <g key={j}>
            <circle
              cx={pt.cx}
              cy={pt.cy}
              r="6"
              fill="none"
              stroke="hsl(32, 55%, 38%)"
              strokeWidth="1"
              opacity={j === 0 || j === 3 ? 0.4 : 0.25}
            />
            <circle
              cx={pt.cx}
              cy={pt.cy}
              r="2"
              fill="hsl(32, 55%, 38%)"
              opacity={j === 0 || j === 3 ? 0.5 : 0.3}
            />
          </g>
        ))}
      </svg>
      <div className="mt-4 flex items-center gap-2">
        <div className="size-1 rounded-full bg-vault-gold/20" />
        <div className="h-px flex-1 bg-vault-gold/10" />
        <span className="text-xs tracking-widest text-vault-gold/30">
          4 STOPS
        </span>
      </div>
    </div>
  )
}

function PhotosVisual() {
  return (
    <div className="rounded-2xl border border-vault-gold/15 bg-gradient-to-b from-vault-surface to-vault-bg p-7">
      <div className="grid grid-cols-3 grid-rows-2 gap-1.5">
        <div className="col-span-2 row-span-2 flex aspect-[4/3] items-center justify-center rounded-md bg-gradient-to-br from-vault-gold/[0.08] to-vault-gold/[0.15]">
          <ImageIcon className="size-6 text-vault-gold/20" />
        </div>
        <div className="aspect-square rounded-md bg-gradient-to-br from-vault-gold/[0.06] to-vault-gold/[0.12]" />
        <div className="aspect-square rounded-md bg-gradient-to-br from-vault-gold/[0.10] to-vault-gold/[0.18]" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="size-1 rounded-full bg-vault-gold/20" />
        <div className="h-px flex-1 bg-vault-gold/10" />
        <span className="text-xs tracking-widest text-vault-gold/30">
          47 PHOTOS
        </span>
      </div>
    </div>
  )
}

// ─── Album preview mockup for CTA ───
function AlbumPreview() {
  return (
    <div className="mx-auto w-64 rounded-xl border border-vault-gold/15 bg-vault-surface/30 p-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-1">
        <div className="col-span-2 aspect-[3/2] rounded bg-gradient-to-br from-vault-gold/[0.08] to-vault-gold/[0.14]" />
        <div className="aspect-square rounded bg-vault-gold/[0.06]" />
        <div className="aspect-square rounded bg-vault-gold/[0.10]" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-[4px] w-3/4 rounded-full bg-vault-gold/15" />
        <div className="h-[3px] w-1/2 rounded-full bg-vault-gold/10" />
      </div>
    </div>
  )
}

const VISUAL_COMPONENTS = {
  journal: JournalVisual,
  route: RouteVisual,
  photos: PhotosVisual,
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
        className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 sm:px-8"
        style={rm ? {} : { opacity: heroOpacity, scale: heroScale }}
      >
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.06] blur-[120px] md:size-[700px]" />
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

        <motion.h1
          className="mt-8 text-center font-serif text-5xl font-semibold leading-[0.95] tracking-[0.04em] text-vault-text md:mt-12 md:text-7xl lg:text-8xl"
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
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-vault-text-dim">
            Scroll to explore
          </span>
          <ChevronDown className="size-4 text-vault-gold/50" />
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════
          VALUE PROPOSITION — What you get
          ═══════════════════════════════════════════ */}
      <section className="relative px-6 pt-16 pb-12 sm:px-8 md:pt-24 md:pb-16">
        <div className="mx-auto max-w-4xl">
          <Reveal disabled={rm}>
            <OrnamentalRule className="mb-6" />
            <h2 className="text-center font-serif text-3xl font-semibold tracking-wide text-vault-text md:text-5xl">
              Built to last
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-base leading-relaxed text-vault-text-dim">
              Your travel journals, routes, and photos deserve more than living
              inside an app. Turn them into something permanent.
            </p>
          </Reveal>

          {/* Alternating rows */}
          <div className="mt-14 flex flex-col gap-12 md:mt-20 md:gap-20">
            {VALUE_PROPS.map((item, i) => {
              const Visual = VISUAL_COMPONENTS[item.visual]
              const reversed = i % 2 === 1

              return (
                <Reveal key={item.title} delay={0.1} disabled={rm}>
                  <div
                    className={cn(
                      "flex flex-col gap-8 md:flex-row md:items-center md:gap-12",
                      reversed && "md:flex-row-reverse",
                    )}
                  >
                    {/* Text */}
                    <div className="flex-1">
                      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-vault-gold/20 bg-vault-gold/[0.08]">
                        <item.icon className="size-5 text-vault-gold" />
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-vault-text md:text-2xl">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-vault-text-dim">
                        {item.desc}
                      </p>
                    </div>

                    {/* Visual */}
                    <div className="flex-1">
                      <Visual />
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS + TRUST
          ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 pt-16 pb-12 sm:px-8 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-4xl">
          <Reveal disabled={rm}>
            <h2 className="text-center font-serif text-3xl font-semibold tracking-wide text-vault-text md:text-5xl">
              Three turns of the key
            </h2>
          </Reveal>

          {/* Horizontal steps on desktop, vertical on mobile */}
          <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3 md:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.15} disabled={rm}>
                <div className="flex gap-5 md:flex-col md:gap-0 md:text-center">
                  <div className="flex shrink-0 items-start md:justify-center">
                    <span className="font-serif text-4xl font-bold text-vault-gold/20 md:text-5xl">
                      {step.num}
                    </span>
                  </div>
                  <div className="md:mt-3">
                    <h3 className="font-serif text-lg font-semibold text-vault-text">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 font-sans text-sm leading-relaxed text-vault-text-dim">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Trust signals */}
          <Reveal delay={0.3} disabled={rm}>
            <div className="mt-12 flex flex-col items-center gap-4 md:mt-16 md:flex-row md:justify-center md:gap-12">
              {TRUST_SIGNALS.map((signal) => (
                <div key={signal.text} className="flex items-center gap-2.5">
                  <signal.icon className="size-4 shrink-0 text-vault-gold/40" />
                  <span className="text-xs text-vault-text-dim">{signal.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Open your vault
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-8 pt-16 pb-20 md:pt-20 md:pb-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-vault-gold/[0.06] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-md text-center">
          <Reveal disabled={rm}>
            <AlbumPreview />

            <h2 className="mt-8 font-serif text-3xl font-semibold tracking-wide text-vault-text md:text-5xl">
              Your memories are waiting
            </h2>

            <Link
              href="/import"
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-vault-gold px-10 py-4 text-base font-medium tracking-wide text-white shadow-md transition-all duration-300 hover:bg-vault-gold/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vault-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-vault-bg"
            >
              Open Your Vault
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

          </Reveal>
        </div>

      </section>
    </main>
  )
}
