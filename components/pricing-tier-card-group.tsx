import * as React from "react"
import { cn } from "@/lib/utils"

export type PricingTierCardGroupProps = {
  children: React.ReactNode
  columns?: number
  className?: string
}

export function PricingTierCardGroup({ children, columns, className }: PricingTierCardGroupProps) {
  const count = columns ?? React.Children.count(children)

  const gridClass =
    count === 1
      ? "max-w-sm mx-auto"
      : count === 2
        ? "grid grid-cols-1 @md:grid-cols-2 max-w-2xl mx-auto gap-4"
        : count === 3
          ? "grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-4"
          : "grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 gap-4"

  return (
    <div className={cn("@container", className)}>
      <div className={cn(gridClass)}>{children}</div>
    </div>
  )
}
