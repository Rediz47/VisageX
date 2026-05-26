"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { PriceData } from "@/lib/paddle-types"

/** Props for the `PricingTierCard` component. */
export type PricingTierCardProps = {
  name: string
  priceData?: PriceData
  description?: string
  features?: string[]
  badge?: string
  icon?: React.ReactNode
  onSelect?: () => void
  ctaLabel?: string
  isSelected?: boolean
  isCurrent?: boolean
  currentPlanLabel?: string
  badgePosition?: "left" | "center" | "right"
  loading?: boolean
  className?: string
}

export function PricingTierCard({
  name,
  priceData,
  description,
  features,
  badge,
  icon,
  onSelect,
  ctaLabel,
  isSelected,
  isCurrent = false,
  currentPlanLabel = "Current plan",
  badgePosition = "center",
  loading = false,
  className,
}: PricingTierCardProps) {
  const { total, originalTotal, interval, trialPeriod } = priceData ?? {}

  // undefined = checkout mode; defined (true/false) = selection mode
  const isSelectionVariant = isSelected !== undefined
  const resolvedCtaLabel =
    ctaLabel ??
    (isCurrent
      ? currentPlanLabel
      : isSelected
        ? "Selected"
        : isSelectionVariant
          ? "Select plan"
          : "Subscribe")

  const showBadges = badge || isCurrent

  // Custom onSelect (e.g. "Contact Sales") stays active on current plan
  const isDisabled = isCurrent && !onSelect

  const ctaVariant = isCurrent ? "secondary" : isSelected ? "default" : "outline"

  if (loading) {
    return (
      <Card className={cn("relative flex flex-col", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            {icon && <Skeleton className="size-10 rounded-md shrink-0" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 pb-3">
          <div className="flex items-baseline gap-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="size-4 shrink-0 mt-0.5" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-0 mt-auto">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card
      data-selected={isSelected || undefined}
      data-current={isCurrent || undefined}
      className={cn(
        "relative flex flex-col h-full overflow-visible transition-all",
        isSelected && "border-primary ring-1 ring-primary",
        isCurrent && "border-muted bg-muted/30",
        className
      )}
    >
      {showBadges && (
        <div
          className={cn(
            "absolute -top-3 z-10 flex gap-1.5",
            badgePosition === "left" && "left-4",
            badgePosition === "center" && "left-1/2 -translate-x-1/2",
            badgePosition === "right" && "right-4"
          )}
        >
          {badge && <Badge className="bg-primary text-primary-foreground">{badge}</Badge>}
          {isCurrent && <Badge variant="secondary">{currentPlanLabel}</Badge>}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {icon && <div className="size-10 rounded-md shrink-0 overflow-hidden">{icon}</div>}
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {priceData && (
          <div>
            {originalTotal && (
              <div className="text-muted-foreground text-sm line-through">{originalTotal}</div>
            )}
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold">{total}</span>
              {interval && <span className="text-muted-foreground text-sm">/ {interval}</span>}
            </div>
            {trialPeriod && (
              <div className="text-muted-foreground text-xs mt-1">{trialPeriod} free trial</div>
            )}
          </div>
        )}

        {features && features.length > 0 && (
          <ul className="space-y-1.5">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckIcon className="size-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="pt-0 mt-auto">
        <Button className="w-full" variant={ctaVariant} disabled={isDisabled} onClick={onSelect}>
          {resolvedCtaLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
