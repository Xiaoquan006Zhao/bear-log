"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Clock, Paperclip, ListTree, Loader2 } from "lucide-react"
import { TableOfContents } from "@/components/table-of-contents"
import type { HtmlMetadata } from "@/lib/file-utils"
import type { TocItem } from "@/lib/toc-utils"
import { Badge } from "@/components/ui/badge"

interface ContentPanelProps {
  selectedFile: string | null
  fileContent: string
  fileMetadata: HtmlMetadata | null
  fileHasAttachments: boolean
  loading: boolean
  tocItems: TocItem[]
  showToc: boolean
  setShowToc: (show: boolean) => void
}

export function ContentPanel({
  selectedFile,
  fileContent,
  fileMetadata,
  fileHasAttachments,
  loading,
  tocItems,
  showToc,
  setShowToc,
}: ContentPanelProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (_) {
      return dateString
    }
  }

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {loading ? "Loading..." : "Select a note to view its content"}
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-3 border-b flex-shrink-0 flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <h2 className="text-lg font-semibold truncate" title={fileMetadata?.title || selectedFile}>
            {fileMetadata?.title || selectedFile}
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
            variant="ghost"
            size="icon"
            onClick={() => setShowToc(!showToc)}
            className="h-8 w-8 p-0"
            title={showToc ? "Hide table of contents" : "Show table of contents"}
          >
            <ListTree className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-auto min-w-0">
          {loading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading content...</span>
            </div>
          ) : (
            <div className="px-4 pt-0 pb-2 overflow-x-auto">
              <div
                className="prose dark:prose-invert max-w-none [&>:first-child]:mt-0 compact-prose"
                style={{ minWidth: "fit-content" }}
                dangerouslySetInnerHTML={{ __html: fileContent }}
              />
            </div>
          )}
        </div>
        {showToc && <TableOfContents items={tocItems} />}
      </div>
    </>
  )
}

