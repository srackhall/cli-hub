import { HelpCircle } from "lucide-react"

interface HelpTooltipProps {
  paramKey: string
  description?: string
}

export function HelpTooltip({ paramKey, description }: HelpTooltipProps) {
  const tooltip = description
    ? `--${paramKey}: ${description}`
    : `--${paramKey}`

  return (
    <span
      className="inline-flex items-center cursor-help text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-150"
      title={tooltip}
      aria-label={tooltip}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </span>
  )
}
