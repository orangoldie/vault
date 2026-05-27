"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { cn } from "@/lib/utils"

const EASE = [0.16, 1, 0.3, 1] as const

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
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={disabled ? undefined : { opacity: 0, y: 32 }}
      animate={disabled ? undefined : inView ? { opacity: 1, y: 0 } : undefined}
      transition={disabled ? undefined : { duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

// ─── Abstract visual composition ───

function RouteThread() {
  return (
    <svg
      className="absolute left-[8%] top-[18%] w-[84%] opacity-80"
      viewBox="0 0 600 120"
      fill="none"
      aria-hidden="true"
    >
      {/* Dashed route line */}
      <path
        d="M20 90 C80 90, 100 30, 170 35 S270 85, 340 55 S430 15, 520 40 S570 70, 580 60"
        stroke="hsl(32, 55%, 38%)"
        strokeWidth="1.5"
        strokeDasharray="4 7"
        opacity="0.3"
      />
      {/* Stop dots */}
      {[
        { cx: 20, cy: 90 },
        { cx: 170, cy: 35 },
        { cx: 340, cy: 55 },
        { cx: 520, cy: 40 },
        { cx: 580, cy: 60 },
      ].map((pt, i) => (
        <g key={i}>
          <circle cx={pt.cx} cy={pt.cy} r="5" fill="none" stroke="hsl(32, 55%, 38%)" strokeWidth="1" opacity="0.25" />
          <circle cx={pt.cx} cy={pt.cy} r="2" fill="hsl(32, 55%, 38%)" opacity="0.35" />
        </g>
      ))}
    </svg>
  )
}

function PhotoFrames() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Large landscape frame */}
      <div
        className="absolute left-[10%] top-[28%] h-[42%] w-[38%] rounded-lg bg-gradient-to-br from-vault-gold/[0.06] to-vault-gold/[0.14]"
        style={{ transform: "rotate(-2deg)" }}
      />
      {/* Portrait frame, overlapping */}
      <div
        className="absolute left-[38%] top-[22%] h-[48%] w-[22%] rounded-lg bg-gradient-to-br from-vault-gold/[0.08] to-vault-gold/[0.16]"
        style={{ transform: "rotate(1.5deg)" }}
      />
      {/* Small square frame */}
      <div
        className="absolute right-[14%] top-[32%] h-[30%] w-[18%] rounded-md bg-gradient-to-br from-vault-gold/[0.05] to-vault-gold/[0.12]"
        style={{ transform: "rotate(3deg)" }}
      />
      {/* Tiny accent frame */}
      <div
        className="absolute right-[28%] top-[58%] h-[18%] w-[14%] rounded-md bg-gradient-to-br from-vault-gold/[0.07] to-vault-gold/[0.13]"
        style={{ transform: "rotate(-1deg)" }}
      />
    </div>
  )
}

function JournalLines() {
  return (
    <div
      className="absolute right-[8%] top-[20%] w-[28%]"
      style={{ transform: "rotate(0.5deg)" }}
      aria-hidden="true"
    >
      <div className="border-l-2 border-vault-gold/15 pl-4">
        {[
          { w: "88%", o: 0.15 },
          { w: "72%", o: 0.12 },
          { w: "80%", o: 0.10 },
          { w: "55%", o: 0.08 },
          { w: "65%", o: 0.06 },
          { w: "45%", o: 0.05 },
        ].map((line, i) => (
          <div
            key={i}
            className="mt-2.5 h-[2px] rounded-full bg-vault-gold first:mt-0"
            style={{ width: line.w, opacity: line.o }}
          />
        ))}
      </div>
    </div>
  )
}

function MapGrid() {
  return (
    <svg
      className="absolute inset-0 size-full"
      viewBox="0 0 600 360"
      fill="none"
      aria-hidden="true"
    >
      {/* Horizontal grid lines */}
      {[60, 120, 180, 240, 300].map((y) => (
        <line
          key={`h-${y}`}
          x1="0" y1={y} x2="600" y2={y}
          stroke="hsl(32, 55%, 38%)"
          strokeWidth="0.5"
          opacity="0.04"
        />
      ))}
      {/* Vertical grid lines */}
      {[75, 150, 225, 300, 375, 450, 525].map((x) => (
        <line
          key={`v-${x}`}
          x1={x} y1="0" x2={x} y2="360"
          stroke="hsl(32, 55%, 38%)"
          strokeWidth="0.5"
          opacity="0.04"
        />
      ))}
      {/* Subtle curved arc — globe curvature hint */}
      <path
        d="M50 340 Q300 180, 550 340"
        stroke="hsl(32, 55%, 38%)"
        strokeWidth="0.8"
        opacity="0.06"
        fill="none"
      />
    </svg>
  )
}

function OrnamentalDetails() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Diamond markers */}
      <div className="absolute left-[6%] top-[50%] size-2 rotate-45 bg-vault-gold/20" />
      <div className="absolute right-[10%] top-[70%] size-1.5 rotate-45 bg-vault-gold/15" />
      <div className="absolute left-[52%] top-[12%] size-1.5 rotate-45 bg-vault-gold/12" />

      {/* Scattered gold dots */}
      <div className="absolute left-[22%] top-[72%] size-1 rounded-full bg-vault-gold/15" />
      <div className="absolute right-[35%] top-[16%] size-1 rounded-full bg-vault-gold/10" />
      <div className="absolute left-[70%] top-[78%] size-1 rounded-full bg-vault-gold/12" />
      <div className="absolute left-[15%] top-[14%] size-0.5 rounded-full bg-vault-gold/10" />
      <div className="absolute right-[18%] top-[48%] size-0.5 rounded-full bg-vault-gold/08" />
    </div>
  )
}

// ─── Main component ───

interface ShowcaseRevealProps {
  reducedMotion?: boolean
  className?: string
}

export function ShowcaseReveal({ reducedMotion = false, className }: ShowcaseRevealProps) {
  const rm = reducedMotion

  return (
    <section
      aria-label="Product showcase"
      className={cn("px-6 pt-4 pb-4 sm:px-8 md:pt-6 md:pb-6", className)}
    >
      <div className="mx-auto max-w-4xl">
        {/* Abstract visual composition */}
        <Reveal disabled={rm}>
          <div
            className="relative mx-auto aspect-[8/3] w-full max-w-3xl max-sm:aspect-[2/1]"
            aria-hidden="true"
          >
            <MapGrid />
            <PhotoFrames />
            <RouteThread />
            <JournalLines />
            <OrnamentalDetails />
          </div>
        </Reveal>

        {/* Text */}
        <div className="mx-auto -mt-2 max-w-lg text-center md:-mt-3">
          <Reveal delay={0.15} disabled={rm}>
            <h2 className="font-serif text-xl font-semibold tracking-wide text-vault-text md:text-2xl">
              From your travel app to a personal archive.
            </h2>
          </Reveal>
          <Reveal delay={0.25} disabled={rm}>
            <p className="mt-2 text-base font-light tracking-wide text-vault-text-dim">
              Export as PDF or interactive website - yours to keep forever.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
