"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, MessageCircle, Star, X } from "lucide-react"

import { cn } from "@/lib/utils"

type Recommend = "Yes" | "Maybe" | "No"
type PriceRange = "Free" | "$1–$10" | "$11–$20" | "$20+"

interface FormValues {
  rating: number
  impression: string
  issues: string
  recommend: Recommend | null
  price: PriceRange | null
  email: string
}

const FORMSPREE_URL = "https://formspree.io/f/xvzvdjda"

const EMPTY_FORM: FormValues = {
  rating: 0,
  impression: "",
  issues: "",
  recommend: null,
  price: null,
  email: "",
}

const RECOMMEND_OPTIONS: Recommend[] = ["Yes", "Maybe", "No"]
const PRICE_OPTIONS: PriceRange[] = ["Free", "$1–$10", "$11–$20", "$20+"]

const INPUT_CLASS =
  "w-full rounded-lg border border-vault-gold/15 bg-vault-surface/50 px-3 py-2.5 text-sm text-vault-text placeholder:text-vault-text-dim/50 focus:border-vault-gold/40 focus:outline-none"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"form" | "thanks">("form")
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setStep("form")
      setValues(EMPTY_FORM)
    }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          rating: values.rating > 0 ? `${values.rating}/5` : "—",
          impression: values.impression || "—",
          issues: values.issues || "—",
          recommend: values.recommend ?? "—",
          price: values.price ?? "—",
          notify_email: values.email || "—",
        }),
      })
      if (res.ok) {
        setStep("thanks")
      } else {
        const body = await res.json()
        console.error("Formspree error:", body)
      }
    } catch (err) {
      console.error("Feedback submit failed:", err)
    } finally {
      setSubmitting(false)
    }
  }

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <>
      {/* ── Floating trigger ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(true)}
            type="button"
            aria-label="Open feedback form"
            className="fixed bottom-6 left-4 z-40 flex items-center gap-2 rounded-full border border-vault-gold/20 bg-vault-surface px-4 py-2.5 text-sm font-medium text-vault-gold shadow-md transition-colors hover:bg-vault-gold hover:text-white"
          >
            <MessageCircle className="size-4 shrink-0" strokeWidth={1.8} />
            Feedback
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Feedback panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-vault-gold/15 bg-vault-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-vault-gold/10 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-vault-gold" strokeWidth={1.8} />
                <span className="font-serif text-sm font-semibold text-vault-text">Share feedback</span>
              </div>
              <button
                onClick={handleClose}
                type="button"
                aria-label="Close feedback panel"
                className="rounded-md p-1 text-vault-text-dim transition-colors hover:text-vault-text"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {step === "form" ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5"
                  >
                    {/* Q1 — Star rating */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        Overall experience
                      </p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => set("rating", n)}
                            aria-label={`Rate ${n} out of 5`}
                            className="rounded p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "size-6 transition-colors",
                                n <= values.rating
                                  ? "fill-vault-gold text-vault-gold"
                                  : "text-vault-gold/25",
                              )}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q2 — First impression */}
                    <div className="space-y-2">
                      <label htmlFor="fb-impression" className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        What is your first impression?
                      </label>
                      <textarea
                        id="fb-impression"
                        rows={4}
                        placeholder="What do you think so far?"
                        value={values.impression}
                        onChange={(e) => set("impression", e.target.value)}
                        className={cn(INPUT_CLASS, "resize-none")}
                      />
                    </div>

                    {/* Q3 — Issues */}
                    <div className="space-y-2">
                      <label htmlFor="fb-issues" className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        Anything broken or confusing?
                      </label>
                      <textarea
                        id="fb-issues"
                        rows={3}
                        placeholder="Bugs, friction, anything frustrating..."
                        value={values.issues}
                        onChange={(e) => set("issues", e.target.value)}
                        className={cn(INPUT_CLASS, "resize-none")}
                      />
                    </div>

                    {/* Q4 — Recommend */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        Would you recommend this?
                      </p>
                      <div className="flex gap-2">
                        {RECOMMEND_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set("recommend", opt)}
                            className={cn(
                              "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                              values.recommend === opt
                                ? "border-vault-gold/40 bg-vault-gold/10 text-vault-gold"
                                : "border-vault-gold/15 text-vault-text-dim hover:border-vault-gold/30",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q5 — Price */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        What would you pay per export?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRICE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set("price", opt)}
                            className={cn(
                              "rounded-lg border py-2 text-xs font-medium transition-colors",
                              values.price === opt
                                ? "border-vault-gold/40 bg-vault-gold/10 text-vault-gold"
                                : "border-vault-gold/15 text-vault-text-dim hover:border-vault-gold/30",
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q6 — Email for next version */}
                    <div className="space-y-2">
                      <label htmlFor="fb-email" className="text-xs font-medium uppercase tracking-[0.1em] text-vault-gold/70">
                        Notify me when the next version is ready
                      </label>
                      <input
                        id="fb-email"
                        type="email"
                        placeholder="your@email.com"
                        value={values.email}
                        onChange={(e) => set("email", e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg bg-vault-gold py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Sending…" : "Send feedback"}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="thanks"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-3 p-8 text-center"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-vault-gold/10 ring-1 ring-vault-gold/20">
                      <Check className="size-5 text-vault-gold" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-serif text-sm font-semibold text-vault-text">Thank you</p>
                      <p className="mt-1 text-xs leading-relaxed text-vault-text-dim">
                        Your feedback helps shape the next version.
                      </p>
                    </div>
                    <button
                      onClick={handleClose}
                      type="button"
                      className="mt-1 text-xs font-medium text-vault-gold/70 transition-colors hover:text-vault-gold"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
