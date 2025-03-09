"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Clock, Paperclip, ListTree } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { HtmlMetadata } from "@/lib/file-utils"

interface ContentHeaderProps {
  fileMetadata: HtmlMetadata | null
  fileHasAttachments: boolean
  showToc: boolean
  setShowToc: (show: boolean) => void
}

export function ContentHeader({ fileMetadata, fileHasAttachments, showToc, setShowToc }: ContentHeaderProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <div className="px-4 py-3 border-b flex-shrink-0 flex items-center justify-between">
      <div className="flex-1 min-w-0 mr-2">
        <h2 className="text-lg font-semibold truncate" title={fileMetadata?.title || ""}>
          {fileMetadata?.title || ""}
        </h2>
        <div className="flex flex-wrap gap-2 mt-1">
          {fileMetadata?.created && (
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>Created: {formatDate(fileMetadata.created)}</span>
              </Badge>
            </div>
          )}
          {fileMetadata?.modified && (
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Modified: {formatDate(fileMetadata.modified)}</span>
              </Badge>
            </div>
          )}
          {fileHasAttachments && (
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Paperclip className="h-3 w-3 flex-shrink-0" />
                <span>Attachments</span>
              </Badge>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowToc(!showToc)}
          className="h-8 flex items-center gap-1"
        >
          <ListTree className="h-4 w-4" />
          <span>{showToc ? "Hide Contents" : "Show Contents"}</span>
        </Button>
      </div>
    </div>
  )
}

