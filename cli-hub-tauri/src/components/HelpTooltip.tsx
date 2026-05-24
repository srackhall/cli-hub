import { Info } from "lucide-react"

interface HelpTooltipProps {
  paramKey: string
  description: string
}

export function HelpTooltip({ paramKey, description }: HelpTooltipProps) {
  return (
    <span
      className="inline-flex items-center cursor-help text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title={`--${paramKey}: ${description}`}
    >
      <Info className="h-3.5 w-3.5" />
    </span>
  )
}
