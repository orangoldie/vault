"use client"

import { motion, type MotionValue } from "framer-motion"

interface VaultDoorProps {
  rotation: MotionValue<number> | number
  className?: string
}

const BOLT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const TICK_COUNT = 60

// Bronze-on-cream palette
const BRONZE = "hsl(32, 55%, 38%)"
const BRONZE_LIGHT = "hsl(32, 40%, 55%)"
const BRONZE_DIM = "hsl(32, 20%, 72%)"
const CREAM = "hsl(38, 30%, 95%)"

export function VaultDoor({ rotation, className }: VaultDoorProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="vault-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={BRONZE} stopOpacity="0.06" />
          <stop offset="60%" stopColor={BRONZE} stopOpacity="0.02" />
          <stop offset="100%" stopColor={BRONZE} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient glow */}
      <circle cx="200" cy="200" r="200" fill="url(#vault-glow)" />

      {/* Outermost decorative ring */}
      <circle
        cx="200" cy="200" r="192"
        stroke={BRONZE_DIM}
        strokeWidth="1"
        fill="none"
      />

      {/* Main outer ring */}
      <circle
        cx="200" cy="200" r="185"
        stroke={BRONZE}
        strokeWidth="2.5"
        fill="none"
        opacity="0.6"
      />

      {/* Inner border ring */}
      <circle
        cx="200" cy="200" r="178"
        stroke={BRONZE_DIM}
        strokeWidth="0.75"
        fill="none"
        opacity="0.4"
      />

      {/* Bolt indicators around the perimeter */}
      {BOLT_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x = 200 + 182 * Math.cos(rad)
        const y = 200 + 182 * Math.sin(rad)
        return (
          <g key={angle}>
            <circle
              cx={x} cy={y} r="7"
              fill={CREAM}
              stroke={BRONZE}
              strokeWidth="1.5"
              opacity="0.6"
            />
            <circle
              cx={x} cy={y} r="2.5"
              fill={BRONZE}
              opacity="0.4"
            />
          </g>
        )
      })}

      {/* ─── Rotating mechanism ─── */}
      <motion.g
        style={{
          rotate: rotation,
          transformOrigin: "200px 200px",
        }}
      >
        {/* Tick mark reference ring */}
        <circle
          cx="200" cy="200" r="155"
          stroke={BRONZE_DIM}
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />

        {/* Tick marks (like a combination dial) */}
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = ((i * 360) / TICK_COUNT) * (Math.PI / 180)
          const isMajor = i % 5 === 0
          const innerR = isMajor ? 143 : 148
          const outerR = 155
          return (
            <line
              key={i}
              x1={200 + innerR * Math.cos(angle)}
              y1={200 + innerR * Math.sin(angle)}
              x2={200 + outerR * Math.cos(angle)}
              y2={200 + outerR * Math.sin(angle)}
              stroke={BRONZE}
              strokeWidth={isMajor ? "1.5" : "0.5"}
              opacity={isMajor ? "0.55" : "0.22"}
            />
          )
        })}

        {/* Inner dial ring */}
        <circle
          cx="200" cy="200" r="120"
          stroke={BRONZE}
          strokeWidth="1.5"
          fill="none"
          opacity="0.3"
        />

        {/* Cross-hair handle */}
        <line
          x1="200" y1="82" x2="200" y2="318"
          stroke={BRONZE}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="82" y1="200" x2="318" y2="200"
          stroke={BRONZE}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Handle endpoints */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const x = 200 + 112 * Math.cos(rad)
          const y = 200 + 112 * Math.sin(rad)
          return (
            <circle
              key={`end-${angle}`}
              cx={x} cy={y} r="5"
              fill={CREAM}
              stroke={BRONZE}
              strokeWidth="1.5"
              opacity="0.55"
            />
          )
        })}

        {/* Center hub */}
        <circle
          cx="200" cy="200" r="28"
          stroke={BRONZE}
          strokeWidth="2"
          fill={CREAM}
          opacity="0.9"
        />
        <circle
          cx="200" cy="200" r="18"
          stroke={BRONZE_LIGHT}
          strokeWidth="0.75"
          fill="none"
          opacity="0.4"
        />

        {/* Center diamond keyhole */}
        <rect
          x="192" y="192" width="16" height="16"
          transform="rotate(45 200 200)"
          fill={BRONZE}
          opacity="0.7"
        />
      </motion.g>
    </svg>
  )
}
