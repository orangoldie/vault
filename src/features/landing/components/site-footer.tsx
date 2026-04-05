import { Shield } from "lucide-react"

import { cn } from "@/lib/utils"

function OrnamentalRule({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)} aria-hidden="true">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-vault-gold/40 md:w-20" />
      <div className="size-1.5 rotate-45 bg-vault-gold/80" />
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-vault-gold/40 md:w-20" />
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-vault-gold/10"
    >
      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8">
        <OrnamentalRule className="mb-6" />

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-vault-gold/40" />
            <span className="text-xs text-vault-text-dim">
              Your data never leaves your browser
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-vault-text-dim">
            <span className="cursor-default">Privacy</span>
            <span className="text-vault-gold/30">&middot;</span>
            <span className="cursor-default">Terms</span>
            <span className="text-vault-gold/30">&middot;</span>
            <span>Journey Vault &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
