"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { TocItem } from "@/lib/toc-utils"
import { cn } from "@/lib/utils"
import type { RawHtmlViewerRef } from "@/components/viewers/raw-html-viewer"

interface TableOfContentsProps {
  items: TocItem[]
  htmlViewerRef: React.RefObject<RawHtmlViewerRef>
}

export function TableOfContents({ items, htmlViewerRef }: TableOfContentsProps) {
  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 text-center text-muted-foreground">
          <span>No headings found</span>
        </div>
      </div>
    )
  }

  const handleHeadingClick = (id: string) => {
    if (htmlViewerRef.current) {
      const success = htmlViewerRef.current.scrollToHeading(id)
      if (!success) {
        console.warn(`Could not find heading with id: ${id}`)
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-background min-w-0">
      <ScrollArea className="flex-1" orientation="both">
        <div className="p-2">
          {items.map((item, index) => {
            // Calculate text size based on heading level
            const textSize = item.level === 1 ? "text-sm font-medium" : "text-sm"

            // Calculate left padding based on heading level
            const paddingLeft = `${(item.level - 1) * 12}px`

            return (
              <div key={index} className="relative">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left mb-1 h-auto py-1.5 flex items-center",
                    textSize,
                    item.level > 1 && "text-muted-foreground",
                    "pl-[calc(24px+var(--indent))] pr-2",
                  )}
                  style={{ "--indent": paddingLeft } as React.CSSProperties}
                  onClick={() => handleHeadingClick(item.id)}
                >
                  {/* Bullet point dot */}
                  <span
                    className={cn(
                      "absolute left-[calc(8px+var(--indent))] top-1/2 -translate-y-1/2 rounded-full",
                      item.level === 1 ? "w-2 h-2 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground",
                    )}
                  />
                  {/* Text container without truncation to allow scrolling */}
                  <span className="block whitespace-normal break-words">{item.text}</span>
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

