"use client"

import { useEffect, useRef } from "react"
import type { MotionValue } from "framer-motion"

interface CartographicDriftProps {
  scrollYProgress?: MotionValue<number>
  className?: string
}

// ── Colour palette — light theme (cream bg, bronze/gold) ──────────────────
const BRONZE = [112,  76,  20] as const   // dark bronze (structural rings)
const GOLD   = [140, 100,  32] as const   // vault-gold  hsl(32,55%,38%)
const GOLD_L = [183, 148,  88] as const   // light gold  (highlights)
const GOLD_D = [210, 185, 140] as const   // dim gold    (faint/subtle)
const STAR_C = [ 70,  50,  18] as const   // dark warm brown (star dots on cream)

// ── Fixed parameters ───────────────────────────────────────────────────────
const SEED                  = 7491
const STAR_COUNT            = 155
const CONSTELLATION_DENSITY = 0.52
const ORBIT_SPEED           = 0.6

export function CartographicDrift({ scrollYProgress, className }: CartographicDriftProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef    = useRef(0)

  useEffect(() => {
    if (!scrollYProgress) return
    return scrollYProgress.on("change", (v) => { scrollRef.current = v })
  }, [scrollYProgress])

  useEffect(() => {
    if (!containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any

    import("p5").then(({ default: P5 }) => {
      if (!containerRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sketch = (p: any) => {
        type Star          = { x: number; y: number; r: number; brt: number; tp: number; ts: number; lm: boolean }
        type Constellation = { a: Star; b: Star; pp: number; ps: number }

        let stars:          Star[]          = []
        let constellations: Constellation[] = []
        let scaleFactor = 1
        let px = 0, py = 0, tpx = 0, tpy = 0

        // Vault is drawn at (cx, 38%) — upper-centre of the canvas
        function vaultCX() { return p.width  * 0.5 }
        function vaultCY() { return p.height * 0.38 }

        function computeScale() {
          scaleFactor = Math.min(p.width, p.height) / 692
        }

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
            })
          }

          constellations = []
          const lms = stars.filter((s) => s.lm)
          for (let i = 0; i < lms.length; i++) {
            for (let j = i + 1; j < lms.length; j++) {
              const d = p.dist(lms[i].x, lms[i].y, lms[j].x, lms[j].y)
              if (d < 190 && p.random() < CONSTELLATION_DENSITY) {
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
          computeScale()
          initSystem()
        }

        p.windowResized = () => {
          if (!containerRef.current) return
          p.resizeCanvas(containerRef.current.offsetWidth, containerRef.current.offsetHeight)
          computeScale()
          p.randomSeed(SEED)
          p.noiseSeed(SEED)
          initSystem()
        }

        p.draw = () => {
          // Smooth parallax — stars drift gently with mouse (the "chasing" effect)
          tpx = p.map(p.mouseX, 0, p.width,  -16, 16)
          tpy = p.map(p.mouseY, 0, p.height, -16, 16)
          px  = p.lerp(px, tpx, 0.044)
          py  = p.lerp(py, tpy, 0.044)

          p.clear()   // transparent canvas — page cream background shows through

          // Stars + constellation lines (parallax layer)
          p.push()
          p.translate(px * 0.65, py * 0.65)
          drawStars()
          drawConstellations()
          p.pop()

          // Vault mechanism — anchored at upper-centre, scaled to canvas
          p.push()
          p.translate(vaultCX(), vaultCY())
          p.scale(scaleFactor)
          drawVault()
          p.pop()
        }

        // ── Stars ─────────────────────────────────────────────────────────────
        function drawStars() {
          p.noStroke()
          for (const s of stars) {
            s.tp += s.ts
            const twk = 0.66 + 0.34 * p.sin(s.tp)
            const a   = s.brt * twk
            if (s.lm) {
              p.fill(GOLD_L[0], GOLD_L[1], GOLD_L[2], a * 35)
              p.ellipse(s.x, s.y, s.r * 7, s.r * 7)
              p.fill(GOLD[0], GOLD[1], GOLD[2], a * 65)
              p.ellipse(s.x, s.y, s.r * 3.5, s.r * 3.5)
            }
            p.fill(STAR_C[0], STAR_C[1], STAR_C[2], a * 200)
            p.ellipse(s.x, s.y, s.r * 2, s.r * 2)
          }
        }

        // ── Constellation lines ────────────────────────────────────────────────
        function drawConstellations() {
          for (const c of constellations) {
            c.pp += c.ps
            const pulse = 0.38 + 0.62 * p.sin(c.pp)
            p.stroke(GOLD[0], GOLD[1], GOLD[2], pulse * 55)
            p.strokeWeight(0.6)
            p.line(c.a.x, c.a.y, c.b.x, c.b.y)
          }
        }

        // ── VAULT MECHANISM ───────────────────────────────────────────────────
        // Rotation design:
        //   rot0  outer combination dial  — PURELY scroll-driven (still when not scrolling)
        //   rot1  middle ring             — ambient CCW, visibly drifting (~45 sec/turn)
        //   rot2  compass rose            — ambient CW,  visibly drifting (~70 sec/turn)
        //   rot3  inner cross + 16-star   — scroll counter-rotation + tiny ambient
        //
        // All radii are in 900-px canonical space; p.scale(scaleFactor) handles real size.
        // All inner fills removed — page cream background shows through transparently.
        function drawVault() {
          const fc        = p.frameCount
          const os        = ORBIT_SPEED
          const scrollOff = scrollRef.current * p.PI * 6   // 3 full turns across hero scroll
          const rot0 =  scrollOff
          const rot1 =  fc * -0.0038 * os   // ~45 sec per full CCW turn at os=0.6
          const rot2 =  fc *  0.0025 * os   // ~70 sec per full CW  turn at os=0.6
          const rot3 = -scrollOff * 0.50 + fc * 0.0022 * os

          // ── Static outer frame ──
          p.noFill()
          p.stroke(GOLD_D[0], GOLD_D[1], GOLD_D[2], 80); p.strokeWeight(0.5)
          p.ellipse(0, 0, 388, 388)

          p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 80); p.strokeWeight(2.0)
          p.ellipse(0, 0, 370, 370)

          p.stroke(GOLD_D[0], GOLD_D[1], GOLD_D[2], 60); p.strokeWeight(0.6)
          p.ellipse(0, 0, 358, 358)

          // 8 bolt studs
          for (let i = 0; i < 8; i++) {
            const a  = (i / 8) * p.TWO_PI + p.PI / 8
            const bx = p.cos(a) * 180, by = p.sin(a) * 180
            p.noFill()
            p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 75); p.strokeWeight(1.2)
            p.ellipse(bx, by, 13, 13)
            p.noStroke(); p.fill(GOLD[0], GOLD[1], GOLD[2], 55)
            p.ellipse(bx, by, 5, 5)
          }

          // ── Rotating combination dial — scroll-driven ──
          p.push(); p.rotate(rot0)
          p.noFill(); p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 70); p.strokeWeight(1.8)
          p.ellipse(0, 0, 342, 342)
          for (let i = 0; i < 60; i++) {
            const a   = (i / 60) * p.TWO_PI
            const maj = i % 5 === 0
            p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], maj ? 90 : 40)
            p.strokeWeight(maj ? 1.4 : 0.6)
            p.line(p.cos(a) * (maj ? 151 : 160), p.sin(a) * (maj ? 151 : 160), p.cos(a) * 171, p.sin(a) * 171)
            if (maj) {
              p.noStroke(); p.fill(GOLD[0], GOLD[1], GOLD[2], 65)
              p.ellipse(p.cos(a) * 146, p.sin(a) * 146, 3.5, 3.5)
            }
          }
          p.fill(GOLD[0], GOLD[1], GOLD[2], 95); p.noStroke()
          p.triangle(0, -179, -5.5, -167, 5.5, -167)
          p.pop()

          // ── Static border rings + cardinal markers ──
          p.noFill()
          p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 75); p.strokeWeight(1.8)
          p.ellipse(0, 0, 298, 298)
          p.stroke(GOLD_D[0], GOLD_D[1], GOLD_D[2], 80); p.strokeWeight(0.6)
          p.ellipse(0, 0, 284, 284)

          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * p.TWO_PI - p.HALF_PI
            p.push()
            p.translate(p.cos(a) * 142, p.sin(a) * 142)
            p.rotate(p.QUARTER_PI)
            p.fill(GOLD[0], GOLD[1], GOLD[2], 85); p.noStroke()
            p.rect(-4.5, -4.5, 9, 9)
            p.pop()
          }

          // ── Rotating middle ring — always drifting CCW ──
          p.push(); p.rotate(rot1)
          p.noFill(); p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 58); p.strokeWeight(1.3)
          p.ellipse(0, 0, 260, 260)
          for (let i = 0; i < 24; i++) {
            const a   = (i / 24) * p.TWO_PI
            const maj = i % 6 === 0
            p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], maj ? 70 : 32)
            p.strokeWeight(maj ? 1.1 : 0.5)
            p.line(p.cos(a) * 123, p.sin(a) * 123, p.cos(a) * 130, p.sin(a) * 130)
          }
          p.pop()

          // ── Inner border ring (static) ──
          p.noFill()
          p.stroke(GOLD_D[0], GOLD_D[1], GOLD_D[2], 90); p.strokeWeight(0.5)
          p.ellipse(0, 0, 228, 228)

          // ── Rotating 8-point compass rose — always drifting CW ──
          p.push(); p.rotate(rot2)
          drawCompassRose(105)
          p.pop()

          // ── Inner hub ring (static) ──
          p.noFill()
          p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 50); p.strokeWeight(1.0)
          p.ellipse(0, 0, 150, 150)
          p.stroke(GOLD_D[0], GOLD_D[1], GOLD_D[2], 65); p.strokeWeight(0.5)
          p.ellipse(0, 0, 140, 140)

          // ── Rotating inner cross + 16-star — scroll + ambient ──
          p.push(); p.rotate(rot3)
          p.noFill(); p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 80); p.strokeWeight(3.5)
          p.strokeCap(p.ROUND)
          p.line(-68, 0, 68, 0); p.line(0, -68, 0, 68)
          for (let i = 0; i < 4; i++) {
            const a  = (i / 4) * p.TWO_PI
            const ex = p.cos(a) * 64, ey = p.sin(a) * 64
            p.noFill(); p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 75); p.strokeWeight(1.2)
            p.ellipse(ex, ey, 14, 14)
            p.noStroke(); p.fill(GOLD[0], GOLD[1], GOLD[2], 65)
            p.ellipse(ex, ey, 5.5, 5.5)
          }
          p.noFill(); p.stroke(GOLD_L[0], GOLD_L[1], GOLD_L[2], 70); p.strokeWeight(0.7)
          p.ellipse(0, 0, 92, 92)
          drawStar16(40)
          p.pop()

          // ── Centre hub — always drawn last ──
          p.noFill(); p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 90); p.strokeWeight(2.0)
          p.ellipse(0, 0, 58, 58)
          p.noFill(); p.stroke(GOLD_L[0], GOLD_L[1], GOLD_L[2], 60); p.strokeWeight(0.7)
          p.ellipse(0, 0, 43, 43)
          // Keyhole diamond
          p.push(); p.rotate(p.QUARTER_PI)
          p.fill(GOLD[0], GOLD[1], GOLD[2], 85); p.noStroke()
          p.rect(-8, -8, 16, 16)
          p.pop()
          p.noStroke(); p.fill(GOLD[0], GOLD[1], GOLD[2], 90)
          p.ellipse(0, 0, 5, 5)
        }

        function drawCompassRose(outerR: number) {
          const innerR = outerR * 0.32
          p.fill(GOLD[0], GOLD[1], GOLD[2], 45)
          p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 60); p.strokeWeight(0.65)
          p.beginShape()
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * p.TWO_PI - p.HALF_PI
            const r = i % 2 === 0 ? outerR : innerR
            p.vertex(p.cos(a) * r, p.sin(a) * r)
          }
          p.endShape(p.CLOSE)
          p.noStroke(); p.fill(GOLD_L[0], GOLD_L[1], GOLD_L[2], 75)
          p.ellipse(0, 0, 11, 11)
        }

        function drawStar16(outerR: number) {
          const innerR = outerR * 0.48
          p.fill(GOLD_L[0], GOLD_L[1], GOLD_L[2], 45)
          p.stroke(BRONZE[0], BRONZE[1], BRONZE[2], 55); p.strokeWeight(0.5)
          p.beginShape()
          for (let i = 0; i < 32; i++) {
            const a = (i / 32) * p.TWO_PI - p.HALF_PI
            const r = i % 2 === 0 ? outerR : innerR
            p.vertex(p.cos(a) * r, p.sin(a) * r)
          }
          p.endShape(p.CLOSE)
        }
      }

      instance = new P5(sketch, containerRef.current!)
    })

    return () => { instance?.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className={className} />
}
