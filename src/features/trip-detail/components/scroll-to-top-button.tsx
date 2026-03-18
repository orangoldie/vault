"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronUp } from "lucide-react"

interface ScrollToTopButtonProps {
  prefersReducedMotion: boolean
}

export function ScrollToTopButton({ prefersReducedMotion }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > window.innerHeight * 2)
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Hide when a fullscreen overlay (lightbox, globe) is open.
  // Both overlays set overflow:hidden on body or documentElement.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const bodyHidden = document.body.style.overflow === "hidden"
      const htmlHidden = document.documentElement.style.overflow === "hidden"
      setOverlayOpen(bodyHidden || htmlHidden)
    })
    observer.observe(document.body, { attributeFilter: ["style"] })
    observer.observe(document.documentElement, { attributeFilter: ["style"] })
    return () => observer.disconnect()
  }, [])

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }

  return (
    <AnimatePresence>
      {visible && !overlayOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll to top"
          className="fixed bottom-32 z-30 flex size-10 items-center justify-center rounded-full bg-vault-surface text-vault-gold shadow-md ring-1 ring-vault-gold/20 transition-colors hover:bg-vault-gold hover:text-white lg:bottom-6"
          style={{ right: "calc(1rem + var(--scrollbar-width, 0px))" }}
        >
          <ChevronUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
