"use client"

import { useRef, useState } from "react"
import { Smartphone, Mail, Upload, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const EXPORT_GUIDE_URL =
  "https://support.polarsteps.com/hc/en-us/articles/24266264821138-How-can-I-export-a-copy-of-my-data"

interface ExportInstructionsProps {
  onFileSelected: (file: File) => void
}

const containerVariants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.18, delayChildren: 0.05 },
  },
}

const stepVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.45, 0, 0.55, 1] as const },
  },
}

const iconVariants = {
  initial: { scale: 0.65, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
}

const lineVariants = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: { duration: 0.3, ease: "easeIn" as const, delay: 0.15 },
  },
}

export function ExportInstructions({ onFileSelected }: ExportInstructionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  function handleButtonClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
      e.target.value = ""
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <section aria-label="Import instructions">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col"
      >
        {/* Step 1 — Request export */}
        <motion.div variants={stepVariants} className="flex gap-5">
          <div className="flex flex-col items-center">
            <motion.div
              variants={iconVariants}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-vault-gold/25 bg-vault-gold/[0.06]"
            >
              <Smartphone className="size-4 text-vault-gold/70" strokeWidth={1.5} />
            </motion.div>
            <motion.div
              variants={lineVariants}
              className="my-2 w-px flex-1 bg-gradient-to-b from-vault-gold/25 to-vault-gold/10"
              style={{ minHeight: 40, transformOrigin: "top" }}
            />
          </div>
          <div className="pb-7 pt-1">
            <h3 className="font-serif text-lg font-semibold text-vault-text">
              Request your export
            </h3>
            <p className="mt-1.5 text-base leading-relaxed text-vault-text-dim">
              Open the Polarsteps app, go to your account settings, and request a copy of your data.
            </p>
            <a
              href={EXPORT_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1 text-xs text-vault-gold/60 transition-colors hover:text-vault-gold/90"
            >
              How to request your data
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </motion.div>

        {/* Step 2 — Download from email */}
        <motion.div variants={stepVariants} className="flex gap-5">
          <div className="flex flex-col items-center">
            <motion.div
              variants={iconVariants}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-vault-gold/25 bg-vault-gold/[0.06]"
            >
              <Mail className="size-4 text-vault-gold/70" strokeWidth={1.5} />
            </motion.div>
            <motion.div
              variants={lineVariants}
              className="my-2 w-px flex-1 bg-gradient-to-b from-vault-gold/25 to-vault-gold/10"
              style={{ minHeight: 40, transformOrigin: "top" }}
            />
          </div>
          <div className="pb-7 pt-1">
            <h3 className="font-serif text-lg font-semibold text-vault-text">
              Download from email
            </h3>
            <p className="mt-1.5 text-base leading-relaxed text-vault-text-dim">
              Polarsteps will email you a download link. This can take a few minutes to 24 hours.
            </p>
          </div>
        </motion.div>

        {/* Step 3 — Upload zone */}
        <motion.div variants={stepVariants} className="flex gap-5">
          <div className="flex flex-col items-start">
            <motion.div
              variants={iconVariants}
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-vault-gold/25 bg-vault-gold/[0.06]"
            >
              <Upload className="size-4 text-vault-gold/70" strokeWidth={1.5} />
            </motion.div>
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-serif text-lg font-semibold text-vault-text">
              Upload your ZIP
            </h3>

            <motion.div
              role="region"
              aria-label="File upload area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              animate={
                isDragOver
                  ? { borderColor: "rgba(180,140,60,0.6)", backgroundColor: "rgba(180,140,60,0.04)" }
                  : { borderColor: "rgba(180,140,60,0.25)", backgroundColor: "transparent" }
              }
              transition={{ duration: 0.15 }}
              className={cn(
                "mt-4 rounded-xl border-2 border-dashed py-8 text-center",
              )}
            >
              <p className="text-sm font-medium text-vault-text">Drop your ZIP file here</p>
              <p className="mt-1 text-xs text-vault-text-dim">or</p>
              <button
                onClick={handleButtonClick}
                className="mt-3 rounded-full bg-vault-gold px-6 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-vault-gold/90"
              >
                Select file
              </button>
              <p className="mt-3 text-xs text-vault-text-dim/60">Accepts .zip files</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleChange}
        className="hidden"
        aria-label="Select travel export ZIP file"
      />
    </section>
  )
}
