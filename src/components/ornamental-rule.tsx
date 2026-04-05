import { cn } from "@/lib/utils"

interface OrnamentalRuleProps {
  className?: string
}

export function OrnamentalRule({ className }: OrnamentalRuleProps) {
  return (
    <div
      className={cn("flex items-center justify-center gap-4", className)}
      aria-hidden="true"
    >
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-vault-gold/40 md:w-20" />
      <div className="size-1.5 rotate-45 bg-vault-gold/80" />
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-vault-gold/40 md:w-20" />
    </div>
  )
}
