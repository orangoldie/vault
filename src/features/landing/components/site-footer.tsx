interface SiteFooterProps {
  disclaimer?: boolean
}

export function SiteFooter({ disclaimer = false }: SiteFooterProps) {
  return (
    <footer
      role="contentinfo"
      className="border-t border-vault-gold/10"
    >
      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8">
        <div className="flex flex-col items-center gap-4">
          {disclaimer && (
            <p className="max-w-xl text-center text-xs leading-relaxed text-vault-text-dim/60">
              Journey Vault is an independent tool and is not affiliated with,
              endorsed by, or officially connected to Polarsteps or its parent
              company. All trademarks belong to their respective owners.
            </p>
          )}
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
