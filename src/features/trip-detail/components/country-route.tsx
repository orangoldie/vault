"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { countryFlagClass } from "@/lib/country-flag"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface CountryRouteProps {
  countryCodes: string[]
  prefersReducedMotion: boolean
}

const regionNames = new Intl.DisplayNames("en", { type: "region" })

function getCountryName(code: string): string {
  try {
    return regionNames.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

const arrowVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08 + 0.2, duration: 0.3, ease: "easeOut" as const },
  }),
}

const flagVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.06 + 0.05, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] as const },
  }),
}

function FlagIcon({ large, cls }: { large?: boolean; cls: string }) {
  return (
    <span
      className={`${cls} inline-block ${large ? "text-2xl" : "text-xl"} rounded-full drop-shadow-sm`}
      role="img"
      aria-hidden="true"
    />
  )
}

function Flag({ code, large }: { code: string; large?: boolean }) {
  const cls = countryFlagClass(code)
  if (!cls) return null
  return <FlagIcon large={large} cls={cls} />
}

function AnimatedFlag({ code, index, large, animate }: {
  code: string; index: number; large?: boolean; animate: string
}) {
  const cls = countryFlagClass(code)
  if (!cls) return null
  return (
    <motion.span
      className={`${cls} inline-block ${large ? "text-2xl" : "text-xl"} rounded-full drop-shadow-sm`}
      role="img"
      aria-hidden="true"
      variants={flagVariants}
      custom={index}
      initial="hidden"
      animate={animate}
    />
  )
}

function FlagTooltip({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{children}</span>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="font-serif text-sm font-medium tracking-wide"
      >
        {getCountryName(code)}
      </TooltipContent>
    </Tooltip>
  )
}

function Arrow({ index, animate }: { index: number; animate: string }) {
  return (
    <motion.span
      className="text-lg text-vault-gold-dim"
      aria-hidden="true"
      variants={arrowVariants}
      custom={index}
      initial="hidden"
      animate={animate}
    >
      →
    </motion.span>
  )
}

export function CountryRoute({ countryCodes, prefersReducedMotion }: CountryRouteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, margin: "-30px" })

  if (countryCodes.length === 0) return null

  const animateState = !prefersReducedMotion && inView ? "visible" : "hidden"

  const fullRouteLabel = `Route: ${countryCodes.map(getCountryName).join(", ")}`
  const count = countryCodes.length

  // Helper to render a flag with tooltip — animated or static based on prefersReducedMotion
  const renderFlag = (code: string, index: number, large?: boolean) => {
    const flag = prefersReducedMotion
      ? <Flag code={code} large={large} />
      : <AnimatedFlag code={code} index={index} large={large} animate={animateState} />
    return <FlagTooltip code={code}>{flag}</FlagTooltip>
  }

  const renderArrow = (index: number) =>
    prefersReducedMotion
      ? <span className="text-lg text-vault-gold-dim" aria-hidden="true">→</span>
      : <Arrow index={index} animate={animateState} />

  // Single country: flag + name
  if (count === 1) {
    return (
      <div ref={containerRef} aria-label={fullRouteLabel} className="flex flex-wrap items-center justify-center gap-2 text-base">
        {renderFlag(countryCodes[0], 0, true)}
        <span className="font-medium">{getCountryName(countryCodes[0])}</span>
      </div>
    )
  }

  // 2–5 countries: flags + names + arrows
  if (count <= 5) {
    return (
      <div ref={containerRef} aria-label={fullRouteLabel} className="flex flex-wrap items-center justify-center gap-2 text-base">
        {countryCodes.map((code, i) => (
          <span key={code} className="inline-flex items-center gap-2">
            {i > 0 && renderArrow(i - 1)}
            {renderFlag(code, i, true)}
            <span className="font-medium">{getCountryName(code)}</span>
          </span>
        ))}
      </div>
    )
  }

  // 6–10 countries: flags only + arrows, names on hover
  if (count <= 10) {
    return (
      <div ref={containerRef} aria-label={fullRouteLabel} className="flex flex-wrap items-center justify-center gap-2.5 text-lg">
        {countryCodes.map((code, i) => (
          <span key={code} className="inline-flex items-center gap-2.5">
            {i > 0 && renderArrow(i - 1)}
            {renderFlag(code, i, true)}
          </span>
        ))}
      </div>
    )
  }

  // 11+ countries: first 3 … last 2 · N countries
  const first3 = countryCodes.slice(0, 3)
  const last2 = countryCodes.slice(-2)

  return (
    <div ref={containerRef} aria-label={fullRouteLabel} className="flex flex-wrap items-center justify-center gap-2.5 text-lg">
      {first3.map((code, i) => (
        <span key={`first-${code}`} className="inline-flex items-center gap-2.5">
          {i > 0 && renderArrow(i - 1)}
          {renderFlag(code, i, true)}
        </span>
      ))}
      <span className="text-vault-gold-dim" aria-hidden="true">…</span>
      {last2.map((code, i) => (
        <span key={`last-${code}`} className="inline-flex items-center gap-2.5">
          {i > 0 && renderArrow(first3.length + i - 1)}
          {renderFlag(code, first3.length + i, true)}
        </span>
      ))}
      <span className="text-sm font-medium text-muted-foreground" aria-hidden="true">
        · {count} countries
      </span>
    </div>
  )
}
