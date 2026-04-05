"use client"

import { cn } from "@/lib/utils"

const BRONZE = "hsl(32, 55%, 38%)"
const BRONZE_DIM = "hsl(32, 20%, 72%)"
const CREAM = "hsl(38, 30%, 95%)"

// Precomputed at module level — keeps server and client renders identical
// by avoiding floating-point serialization differences at render time.
const TICK_MARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const isMajor = i % 3 === 0
  return {
    x1: +((200 + 140 * cos).toFixed(3)),
    y1: +((200 + 140 * sin).toFixed(3)),
    x2: +((200 + 158 * cos).toFixed(3)),
    y2: +((200 + 158 * sin).toFixed(3)),
    strokeWidth: isMajor ? "5" : "2.5",
    opacity: isMajor ? "0.5" : "0.25",
  }
})

const HANDLE_ENDPOINTS = [0, 90, 180, 270].map((deg) => {
  const rad = (deg * Math.PI) / 180
  return {
    cx: +((200 + 100 * Math.cos(rad)).toFixed(3)),
    cy: +((200 + 100 * Math.sin(rad)).toFixed(3)),
  }
})

interface MiniVaultProps {
  className?: string
}

/**
 * A tiny vault-door icon for the site header.
 * Uses a CSS animation for slow ambient rotation on the inner mechanism.
 * Lightweight alternative to a full p5.js canvas at icon-size.
 */
export function MiniVault({ className }: MiniVaultProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="200" cy="200" r="190"
        stroke={BRONZE}
        strokeWidth="6"
        fill="none"
        opacity="0.5"
      />

      {/* Inner border */}
      <circle
        cx="200" cy="200" r="170"
        stroke={BRONZE_DIM}
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />

      {/* Rotating mechanism */}
      <g className="origin-center animate-[spin_240s_linear_infinite] motion-reduce:animate-none">
        {/* Tick marks */}
        {TICK_MARKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={BRONZE}
            strokeWidth={t.strokeWidth}
            opacity={t.opacity}
          />
        ))}

        {/* Cross-hair handle */}
        <line
          x1="200" y1="90" x2="200" y2="310"
          stroke={BRONZE}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="90" y1="200" x2="310" y2="200"
          stroke={BRONZE}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Handle endpoints */}
        {HANDLE_ENDPOINTS.map((p, i) => (
          <circle
            key={i}
            cx={p.cx}
            cy={p.cy}
            r="12"
            fill={CREAM}
            stroke={BRONZE}
            strokeWidth="4"
            opacity="0.5"
          />
        ))}

        {/* Centre hub */}
        <circle
          cx="200" cy="200" r="32"
          stroke={BRONZE}
          strokeWidth="5"
          fill={CREAM}
          opacity="0.8"
        />

        {/* Center diamond keyhole */}
        <rect
          x="190" y="190" width="20" height="20"
          transform="rotate(45 200 200)"
          fill={BRONZE}
          opacity="0.6"
        />
      </g>
    </svg>
  )
}
