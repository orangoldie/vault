"use client"

import { useEffect, useRef, useState } from "react"

interface GlobeStarfieldProps {
  className?: string
}

// ── Colour palette — dark overlay (black bg, warm white + gold) ──────────────
const STAR_C  = [255, 244, 224] as const   // warm white (star dots)
const GOLD    = [221, 146,  60] as const   // vault-gold hsl(32,70%,55%)
const GOLD_L  = [240, 200, 140] as const   // light gold (halo highlight)

// ── Fixed parameters ─────────────────────────────────────────────────────────
const SEED                  = 4817
const STAR_COUNT            = 155
const CONSTELLATION_DENSITY = 0.55
const DRIFT_AMP             = 8      // max ambient wander, px
const DRIFT_SPEED           = 0.0024 // noise advance per frame

export function GlobeStarfield({ className }: GlobeStarfieldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any

    import("p5").then(({ default: P5 }) => {
      if (!containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sketch = (p: any) => {
        type Star          = { x: number; y: number; r: number; brt: number; tp: number; ts: number; lm: boolean; nz: number; ox: number; oy: number }
        type Constellation = { a: Star; b: Star; pp: number; ps: number }

        let stars:          Star[]          = []
        let constellations: Constellation[] = []
        let px = 0, py = 0, tpx = 0, tpy = 0

        function initSystem() {
          p.randomSeed(SEED)
          p.noiseSeed(SEED)

          stars = []
          for (let i = 0; i < STAR_COUNT; i++) {
            const lm = p.random() < 0.10
            stars.push({
              x:   p.random(p.width),
              y:   p.random(p.height),
              r:   lm ? p.random(1.8, 3.2) : p.random(0.5, 1.8),
              brt: lm ? p.random(0.65, 1.0) : p.random(0.20, 0.65),
              tp:  p.random(p.TWO_PI),
              ts:  p.random(0.012, 0.038),
              lm,
              nz:  p.random(1000),
              ox:  0,
              oy:  0,
            })
          }

          constellations = []
          const lms = stars.filter((s) => s.lm)
          for (let i = 0; i < lms.length; i++) {
            for (let j = i + 1; j < lms.length; j++) {
              const d = p.dist(lms[i].x, lms[i].y, lms[j].x, lms[j].y)
              if (d < 220 && p.random() < CONSTELLATION_DENSITY) {
                constellations.push({ a: lms[i], b: lms[j], pp: p.random(p.TWO_PI), ps: p.random(0.008, 0.022) })
              }
            }
          }
        }

        p.setup = () => {
          const el  = containerRef.current!
          const cnv = p.createCanvas(el.offsetWidth, el.offsetHeight)
          cnv.elt.style.display       = "block"
          cnv.elt.style.pointerEvents = "none"
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2))
          p.frameRate(60)
          initSystem()
        }

        p.windowResized = () => {
          if (!containerRef.current) return
          p.resizeCanvas(containerRef.current.offsetWidth, containerRef.current.offsetHeight)
          initSystem()
        }

        p.draw = () => {
          // Smooth parallax — stars drift gently with mouse
          tpx = p.map(p.mouseX, 0, p.width,  -16, 16)
          tpy = p.map(p.mouseY, 0, p.height, -16, 16)
          px  = p.lerp(px, tpx, 0.044)
          py  = p.lerp(py, tpy, 0.044)

          p.clear()   // transparent canvas — overlay's black background shows through

          updateDrift()

          p.push()
          p.translate(px * 0.65, py * 0.65)
          drawConstellations()
          drawStars()
          p.pop()
        }

        // Slow ambient wander so the field feels alive even when the cursor is still.
        // Offsets are stored per-star so constellation lines stay attached.
        function updateDrift() {
          const t = p.frameCount * DRIFT_SPEED
          for (const s of stars) {
            s.ox = (p.noise(s.nz, t) - 0.5) * 2 * DRIFT_AMP
            s.oy = (p.noise(s.nz + 500, t) - 0.5) * 2 * DRIFT_AMP
          }
        }

        function drawStars() {
          p.noStroke()
          for (const s of stars) {
            s.tp += s.ts
            const twk = 0.66 + 0.34 * p.sin(s.tp)
            const a   = s.brt * twk
            const x   = s.x + s.ox
            const y   = s.y + s.oy
            if (s.lm) {
              p.fill(GOLD[0], GOLD[1], GOLD[2], a * 40)
              p.ellipse(x, y, s.r * 7, s.r * 7)
              p.fill(GOLD_L[0], GOLD_L[1], GOLD_L[2], a * 75)
              p.ellipse(x, y, s.r * 3.5, s.r * 3.5)
            }
            p.fill(STAR_C[0], STAR_C[1], STAR_C[2], a * 220)
            p.ellipse(x, y, s.r * 2, s.r * 2)
          }
        }

        function drawConstellations() {
          for (const c of constellations) {
            c.pp += c.ps
            const pulse = 0.38 + 0.62 * p.sin(c.pp)
            p.stroke(GOLD[0], GOLD[1], GOLD[2], pulse * 60)
            p.strokeWeight(0.6)
            p.line(c.a.x + c.a.ox, c.a.y + c.a.oy, c.b.x + c.b.ox, c.b.y + c.b.oy)
          }
        }
      }

      instance = new P5(sketch, containerRef.current!)
    })

    return () => { instance?.remove() }
  }, [reducedMotion])

  if (reducedMotion) return null
  return <div ref={containerRef} className={className} aria-hidden="true" />
}
