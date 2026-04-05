import { Scale } from "lucide-react"

import { OrnamentalRule } from "@/components/ornamental-rule"

export function ImportDisclaimer() {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-8 pt-16 sm:px-8">
      <OrnamentalRule className="mb-8" />

      <aside aria-label="Legal notice">
        <div className="flex items-start gap-4 rounded-2xl border border-vault-gold/20 bg-vault-surface px-7 py-6">
          <Scale
            className="mt-0.5 size-4 shrink-0 text-vault-gold/50"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-vault-text-dim">
            Journey Vault is an independent tool and is not affiliated with,
            endorsed by, or in any way officially connected to Polarsteps,
            FindPenguins, or their parent companies. All trademarks and brand
            names belong to their respective owners.
          </p>
        </div>
      </aside>
    </div>
  )
}
