"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2, ChevronLeft } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { FileCard } from "@/components/panels/file-item"
import type { HtmlMetadata } from "@/lib/file-utils"
import { Badge } from "@/components/ui/badge"

interface FilesPanelProps {
  selectedFolder: string
  selectedFile: string | null
  files: { file: string; metadata: HtmlMetadata; imageAttachments?: string[] }[]
  pagination: {
    page: number
    hasMore: boolean
    total: number
    loading: boolean
  }
  loading: boolean
  collapsed: boolean
  togglePanel: () => void
  selectFile: (filename: string) => void
  loadMoreFiles: () => void
}

export function FilesPanel({
  selectedFolder,
  selectedFile,
  files,
  pagination,
  loading,
  collapsed,
  togglePanel,
  selectFile,
  loadMoreFiles,
}: FilesPanelProps) {
  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null)
  const [previousSelectedFile, setPreviousSelectedFile] = useState(selectedFile)

  // Setup virtualization for file list
  const rowVirtualizer = useVirtualizer({
    count: files.length + (pagination.hasMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // If it's the loader row
      if (index === files.length) {
        return 80
      }

      const item = files[index]
      // If the file has image attachments
      if (item.imageAttachments?.length) {
        // Fixed height for cards with images
        return 200 // Title area + fixed image height + padding
      }
      // Default height for files without images
      return 80
    },
    overscan: 10, // Increase overscan to keep more items in the DOM
  })

  // Check if we need to load more files
  const checkAndLoadMoreFiles = () => {
    if (pagination.hasMore && !pagination.loading) {
      loadMoreFiles()
      return true
    }
    return false
  }

  // Handle keyboard navigation with pagination support
  useEffect(() => {
    // Skip if panel is collapsed
    if (collapsed) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this panel is focused/active
      if (collapsed) return

      const currentIndex = files.findIndex((file) => file.file === selectedFile)

      if (e.key === "ArrowDown") {
        e.preventDefault()

        // If we're at the last file and there are more files to load
        if (currentIndex === files.length - 1) {
          // Try to load more files
          const loadingMore = checkAndLoadMoreFiles()

          // If we're not loading more (no more to load), don't do anything
          if (!loadingMore) return
        }

        // If we're not at the end, or we're loading more, select the next file
        if (currentIndex < files.length - 1) {
          selectFile(files[currentIndex + 1].file)
        }
      } else if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault()
        selectFile(files[currentIndex - 1].file)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [files, selectedFile, collapsed, selectFile, pagination.hasMore, pagination.loading, loadMoreFiles])

  // Scroll to selected file ONLY when the selected file actually changes
  useEffect(() => {
    if (selectedFile && !collapsed && files.length > 0) {
      const selectedIndex = files.findIndex((file) => file.file === selectedFile)

      if (selectedIndex >= 0) {
        // Only scroll when the selectedFile value changes
        rowVirtualizer.scrollToIndex(selectedIndex, {
          align: "auto",
          behavior: "auto",
        })
      }
    }
  }, [selectedFile, collapsed, rowVirtualizer]) // Only depend on selectedFile changes, not files or pagination

  // Add an effect to check scroll position and load more if needed
  useEffect(() => {
    const checkScroll = () => {
      if (collapsed || !parentRef.current) return

      const container = parentRef.current
      const scrollPosition = container.scrollTop + container.clientHeight
      const scrollThreshold = container.scrollHeight * 0.8 // Load more when within 20% of the bottom

      if (scrollPosition >= scrollThreshold && pagination.hasMore && !pagination.loading) {
        loadMoreFiles()
      }
    }

    // Check on mount and when files or pagination changes
    checkScroll()
  }, [files, pagination, collapsed, loadMoreFiles])

  if (collapsed) {
    return (
      <div className="h-full bg-muted/50 flex flex-col pointer-events-auto">
        <div className="p-4 flex-shrink-0 flex justify-center border-b">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center pointer-events-auto cursor-pointer"
            onClick={togglePanel}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1"></div>
      </div>
    )
  }

  const folderDisplayName = selectedFolder ? selectedFolder.split("/").pop() : "Root"

  return (
    <>
      <div className="p-4 border-b flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 max-w-[calc(100%-40px)]">
            <h2 className="text-lg font-semibold truncate" title={folderDisplayName}>
              {folderDisplayName}
            </h2>
            {pagination.total > 0 && (
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {pagination.total}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0 cursor-pointer"
            onClick={togglePanel}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      <div
        ref={parentRef}
        className={`flex-1 overflow-auto ${collapsed ? "pointer-events-none" : ""}`}
        onScroll={(e) => {
          if (collapsed) return // Don't process scroll events when collapsed
          const target = e.target as HTMLDivElement
          if (
            target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5 &&
            pagination.hasMore &&
            !pagination.loading
          ) {
            loadMoreFiles()
          }
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            minWidth: "250px",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index === files.length

            if (isLoaderRow) {
              return (
                <div
                  key="loader"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="p-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Loading more...</span>
                  </div>
                </div>
              )
            }

            const item = files[virtualRow.index]

            return (
              <div
                key={item.file}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="p-2"
              >
                <FileCard
                  file={item.file}
                  metadata={item.metadata}
                  imageAttachments={item.imageAttachments || []}
                  isSelected={selectedFile === item.file}
                  onClick={() => selectFile(item.file)}
                />
              </div>
            )
          })}
        </div>

        {files.length === 0 && !loading && (
          <div className="p-4 text-center text-muted-foreground">No notes in this folder</div>
        )}
      </div>
    </>
  )
}

