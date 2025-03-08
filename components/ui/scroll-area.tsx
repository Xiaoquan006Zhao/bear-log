"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    orientation?: "vertical" | "horizontal" | "both"
  }
>(({ className, children, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
    {(orientation === "vertical" || orientation === "both") && (
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className={cn(
          "flex touch-none select-none transition-colors",
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
          "data-[orientation=vertical]:w-2.5",
        )}
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
    )}
    {(orientation === "horizontal" || orientation === "both") && (
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className={cn(
          "flex touch-none select-none transition-colors",
          "h-2.5 border-t border-t-transparent p-[1px]",
          "data-[orientation=horizontal]:h-2.5",
        )}
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollAreaPrimitive.Scrollbar>
    )}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

export { ScrollArea }

