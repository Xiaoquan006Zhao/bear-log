"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TocItem } from "@/lib/toc-utils"
import { scrollToHeading } from "@/lib/toc-utils"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TableOfContentsProps {
  items: TocItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  if (items.length === 0) {
    return (
      <div className="border-l h-full flex flex-col bg-background w-64">
        <div className="p-4 text-center text-muted-foreground">
          <span>No headings found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="border-l h-full flex flex-col bg-background w-64 min-w-0 flex-shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-2">
          {items.map((item, index) => {
            // Calculate text size based on heading level
            const textSize = item.level === 1 ? "text-sm font-medium" : "text-sm"

            // Calculate left padding based on heading level
            const paddingLeft = `${(item.level - 1) * 12}px`

            return (
              <TooltipProvider key={index} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left mb-1 h-auto py-1.5",
                          textSize,
                          item.level > 1 && "text-muted-foreground",
                          "pl-[calc(24px+var(--indent))] pr-2", // Added right padding
                        )}
                        style={{ "--indent": paddingLeft } as React.CSSProperties}
                        onClick={() => scrollToHeading(item.id)}
                      >
                        {/* Bullet point dot */}
                        <span
                          className={cn(
                            "absolute left-[calc(8px+var(--indent))] top-1/2 -translate-y-1/2 rounded-full",
                            item.level === 1 ? "w-2 h-2 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground",
                          )}
                        />
                        {/* Text container with proper truncation */}
                        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.text}
                        </span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-[300px] z-50">
                    {item.text}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

