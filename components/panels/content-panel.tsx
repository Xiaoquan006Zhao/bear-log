"use client"

import { useRef, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { TableOfContents } from "@/components/table-of-contents"
import type { HtmlMetadata } from "@/lib/file-utils"
import type { TocItem } from "@/lib/toc-utils"
import { RawHtmlViewer, type RawHtmlViewerRef } from "@/components/viewers/raw-html-viewer"
import { ContentHeader } from "@/components/panels/content-header"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

// Default TOC panel width (percentage)
const DEFAULT_TOC_WIDTH = 25

interface ContentPanelProps {
  selectedFile: string | null
  rawHtml: string
  fileMetadata: HtmlMetadata | null
  fileHasAttachments: boolean
  loading: boolean
  tocItems: TocItem[]
  showToc: boolean
  setShowToc: (show: boolean) => void
}

export function ContentPanel({
  selectedFile,
  rawHtml,
  fileMetadata,
  fileHasAttachments,
  loading,
  tocItems,
  showToc,
  setShowToc,
}: ContentPanelProps) {
  // Create a ref to access the RawHtmlViewer methods
  const htmlViewerRef = useRef<RawHtmlViewerRef>(null)

  // Reset scroll position when selected file changes
  useEffect(() => {
    if (htmlViewerRef.current && !loading) {
      // Small timeout to ensure content is loaded
      setTimeout(() => {
        htmlViewerRef.current?.scrollToTop()
      }, 50)
    }
  }, [selectedFile, loading])

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {loading ? "Loading..." : "Select a note to view its content"}
      </div>
    )
  }

  // Calculate base URL for the iframe if needed
  // const baseUrl = fileHasAttachments ? `/api/attachments/${encodeURIComponent(selectedFile.replace(".html", ""))}/` : ""
  const baseUrl = 'data/'
  const altAttachmentDirectory = selectedFile.replace(".html", "")

  // Handle TOC auto-collapse
  const handlePanelResize = (sizes: number[]) => {
    if (sizes.length >= 2) {
      // If TOC panel gets too small, auto-collapse it
      if (sizes[1] <= 10) {
        setShowToc(false)
      }
    }
  }

  return (
    <>
      <ContentHeader
        fileMetadata={fileMetadata}
        fileHasAttachments={fileHasAttachments}
        showToc={showToc}
        setShowToc={setShowToc}
      />

      <div className="flex-1 overflow-hidden">
        {showToc ? (
          <ResizablePanelGroup direction="horizontal" className="h-full" onLayout={handlePanelResize}>
            {/* Content Panel */}
            <ResizablePanel defaultSize={100 - DEFAULT_TOC_WIDTH} minSize={30} className="overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading content...</span>
                </div>
              ) : (
                <div className="h-full">
                  <RawHtmlViewer ref={htmlViewerRef} htmlContent={rawHtml} baseUrl={baseUrl} altAttachmentDirectory={altAttachmentDirectory} />
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* TOC Panel */}
            <ResizablePanel
              defaultSize={DEFAULT_TOC_WIDTH}
              minSize={10}
              maxSize={40}
              className="min-w-0 overflow-hidden"
            >
              <TableOfContents items={tocItems} htmlViewerRef={htmlViewerRef} />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading content...</span>
              </div>
            ) : (
              <div className="h-full">
                <RawHtmlViewer ref={htmlViewerRef} htmlContent={rawHtml}  baseUrl={baseUrl} altAttachmentDirectory={altAttachmentDirectory} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

