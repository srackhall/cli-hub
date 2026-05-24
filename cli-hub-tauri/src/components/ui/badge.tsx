import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & { variant?: "default" | "secondary" | "destructive" | "outline" }) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border text-foreground",
  }
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-1.5 text-xs font-medium leading-normal transition-colors",
        variantClasses[variant ?? "default"],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
