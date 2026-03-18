"use client"

import { useEffect, useRef, useState } from "react"

interface StatCountUpProps {
  value: number
  duration?: number
  prefersReducedMotion: boolean
  /** If true, the count-up waits until triggered externally */
  paused?: boolean
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function StatCountUp({
  value,
  duration = 1200,
  prefersReducedMotion,
  paused = false,
}: StatCountUpProps) {
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (prefersReducedMotion || hasAnimated.current) {
      setDisplay(value)
      return
    }

    if (paused) return

    hasAnimated.current = true
    let start: number | null = null
    let rafId: number

    function tick(timestamp: number) {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)

      setDisplay(Math.round(easedProgress * value))

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [value, duration, prefersReducedMotion, paused])

  return <>{Math.round(display).toLocaleString("en-US")}</>
}
