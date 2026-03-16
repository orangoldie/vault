"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

export function RouteLine() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" })
  const prefersReducedMotion = useReducedMotion()

  return (
    <div ref={ref} className="flex justify-center" aria-hidden="true">
      <motion.div
        className="w-px border-l-[3px] border-dashed border-vault-gold-dim/50"
        initial={prefersReducedMotion ? { height: 40 } : { height: 0 }}
        animate={isInView ? { height: 40 } : { height: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
