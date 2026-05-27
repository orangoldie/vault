"use client"

import { cn } from "@/lib/utils"

interface CompassRoseProps {
  size?: number
  className?: string
}

/**
 * Decorative SVG compass rose frame.
 * Wraps around the globe to give it a "navigator's instrument" feel.
 */
export function CompassRose({ size = 220, className }: CompassRoseProps) {
  const center = size / 2
  const outerR = size / 2 - 2
  const innerR = size / 2 - 20
  const tickR = innerR - 4
  const labelR = outerR + 10

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-8 -8 ${size + 16} ${size + 16}`}
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
      overflow="visible"
    >
      {/* Outer ring */}
      <circle
        cx={center}
        cy={center}
        r={outerR}
        fill="none"
        stroke="var(--color-vault-gold-dim)"
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* Inner ring */}
      <circle
        cx={center}
        cy={center}
        r={innerR}
        fill="none"
        stroke="var(--color-vault-gold-dim)"
        strokeWidth={0.75}
        opacity={0.4}
      />

      {/* Cardinal tick marks */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x1 = center + Math.sin(rad) * innerR
        const y1 = center - Math.cos(rad) * innerR
        const x2 = center + Math.sin(rad) * outerR
        const y2 = center - Math.cos(rad) * outerR
        return (
          <line
            key={`cardinal-${angle}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-vault-gold-dim)"
            strokeWidth={1.5}
            opacity={0.7}
          />
        )
      })}

      {/* Intercardinal tick marks (shorter) */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const midR = innerR + (outerR - innerR) * 0.3
        const x1 = center + Math.sin(rad) * midR
        const y1 = center - Math.cos(rad) * midR
        const x2 = center + Math.sin(rad) * outerR
        const y2 = center - Math.cos(rad) * outerR
        return (
          <line
            key={`inter-${angle}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-vault-gold-dim)"
            strokeWidth={0.75}
            opacity={0.4}
          />
        )
      })}

      {/* Minor tick marks (every 15 degrees) */}
      {Array.from({ length: 24 }, (_, i) => i * 15)
        .filter((a) => a % 45 !== 0)
        .map((angle) => {
          const rad = (angle * Math.PI) / 180
          const startR = outerR - 3
          const x1 = center + Math.sin(rad) * startR
          const y1 = center - Math.cos(rad) * startR
          const x2 = center + Math.sin(rad) * outerR
          const y2 = center - Math.cos(rad) * outerR
          return (
            <line
              key={`minor-${angle}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-vault-gold-dim)"
              strokeWidth={0.5}
              opacity={0.3}
            />
          )
        })}

      {/* Small decorative dots at intercardinals */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const dotR = outerR - 1.5
        return (
          <circle
            key={`dot-${angle}`}
            cx={center + Math.sin(rad) * dotR}
            cy={center - Math.cos(rad) * dotR}
            r={1}
            fill="var(--color-vault-gold-dim)"
            opacity={0.5}
          />
        )
      })}

      {/* Cardinal labels */}
      {(
        [
          { label: "N", angle: 0 },
          { label: "E", angle: 90 },
          { label: "S", angle: 180 },
          { label: "W", angle: 270 },
        ] as const
      ).map(({ label, angle }) => {
        const rad = (angle * Math.PI) / 180
        const x = center + Math.sin(rad) * labelR
        const y = center - Math.cos(rad) * labelR
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-vault-gold-dim)"
            fontSize={10}
            fontFamily="var(--font-sans)"
            fontWeight={600}
            letterSpacing="0.05em"
            opacity={0.8}
          >
            {label}
          </text>
        )
      })}

      {/* Center crosshair (visible when globe hasn't loaded) */}
      <line
        x1={center - 6}
        y1={center}
        x2={center + 6}
        y2={center}
        stroke="var(--color-vault-gold-dim)"
        strokeWidth={0.5}
        opacity={0.2}
      />
      <line
        x1={center}
        y1={center - 6}
        x2={center}
        y2={center + 6}
        stroke="var(--color-vault-gold-dim)"
        strokeWidth={0.5}
        opacity={0.2}
      />
    </svg>
  )
}
