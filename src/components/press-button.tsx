"use client"

import { useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type PressButtonProps = {
  onPress: () => void
  className?: string
  children: ReactNode
  disabled?: boolean
  ariaLabel?: string
  ariaExpanded?: boolean
}

export function PressButton({
  onPress,
  className,
  children,
  disabled,
  ariaLabel,
  ariaExpanded,
}: PressButtonProps) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const consumedByTouch = useRef(false)

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      className={cn(
        "cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent]",
        className
      )}
      onTouchStart={(event) => {
        const touch = event.changedTouches[0]
        start.current = { x: touch.clientX, y: touch.clientY }
        consumedByTouch.current = false
      }}
      onTouchEnd={(event) => {
        if (disabled) return
        const touch = event.changedTouches[0]
        const origin = start.current
        if (!touch || !origin) return
        if (Math.hypot(touch.clientX - origin.x, touch.clientY - origin.y) > 12) {
          return
        }
        event.preventDefault()
        consumedByTouch.current = true
        onPress()
      }}
      onClick={(event) => {
        if (disabled) return
        if (consumedByTouch.current) {
          event.preventDefault()
          consumedByTouch.current = false
          return
        }
        onPress()
      }}
    >
      {children}
    </button>
  )
}
