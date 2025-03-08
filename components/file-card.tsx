"use client"

import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { HtmlMetadata } from "@/lib/file-utils"
import { ImagePreviewGrid } from "./image-preview-grid"

interface FileCardProps {
  file: string
  metadata: HtmlMetadata
  imageAttachments: string[]
  isSelected: boolean
  onClick: () => void
}

export function FileCard({ file, metadata, imageAttachments, isSelected, onClick }: FileCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      // Format as "MM/DD/YYYY, HH:MM AM/PM"
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (_) {
      return dateString
    }
  }

  return (
    <Card
      className={`group flex flex-col h-full overflow-hidden transition-colors cursor-pointer border ${
        isSelected ? "bg-secondary border-primary shadow-sm" : "hover:bg-secondary/40 border-border/50"
      }`}
      onClick={onClick}
    >
      <div className="p-3 flex-shrink-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm overflow-hidden text-ellipsis">
              <span className="whitespace-nowrap block overflow-hidden text-ellipsis">{metadata.title || file}</span>
            </div>
            {(metadata.modified || metadata.created) && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <div className="overflow-hidden text-ellipsis">
                  <span className="whitespace-nowrap block overflow-hidden text-ellipsis">
                    {formatDate(metadata.modified || metadata.created || "")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Attachments Preview */}
      {imageAttachments.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ImagePreviewGrid images={imageAttachments} maxHeight={120} />
        </div>
      )}
    </Card>
  )
}

