"use client"

import { useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { usePanelState } from "@/hooks/use-panel-state"
import { useFolderStructure } from "@/hooks/use-folder-structure"
import { useFileContent } from "@/hooks/use-file-content"
import { FolderPanel } from "@/components/folder-panel"
import { FilesPanel } from "@/components/files-panel"
import { ContentPanel } from "@/components/content-panel"

// Import the error boundary
import { ErrorBoundary } from "@/components/error-boundary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

import fs from "fs/promises"
import path from "path"

export const CONTENTS_DIR = path.join(process.cwd(), "/app/contents");

// Type for folder structure
// @ts-ignore
interface FolderNode {
  name: string
  path: string
  children: Record<string, FolderNode>
  files: string[]
  totalUniqueFiles: number
}

export default function HtmlViewer() {
  // Use our custom hooks
  const {
    leftPanelCollapsed,
    middlePanelCollapsed,
    toggleLeftPanel,
    toggleMiddlePanel,
    handlePanelResize,
    getLeftPanelSize,
    getMiddlePanelSize,
    getRightPanelSize,
    setMiddlePanelCollapsed,
  } = usePanelState()

  const {
    selectedFile,
    fileContent,
    fileMetadata,
    fileHasAttachments,
    loading: contentLoading,
    tocItems,
    showToc,
    loadFileContent,
    setShowToc,
  } = useFileContent()

  // Callback for file selection that will be passed to the folder structure hook
  const handleFileSelect = useCallback(
    (filename: string) => {
      loadFileContent(filename)
    },
    [loadFileContent],
  )

  const {
    folderStructure,
    selectedFolder,
    expandedFolders,
    currentFolderFiles,
    loading,
    pagination,
    selectFolder,
    toggleFolder,
    loadMoreFiles,
  } = useFolderStructure(handleFileSelect)

  // Handle file selection
  const selectFile = useCallback(
    (filename: string) => {
      loadFileContent(filename)
    },
    [loadFileContent],
  )

  // Handle folder selection with panel expansion
  const handleFolderSelect = useCallback(
    (path: string) => {
      selectFolder(path)
      // If middle panel is collapsed, expand it
      if (middlePanelCollapsed) {
        setMiddlePanelCollapsed(false)
      }
    },
    [selectFolder, middlePanelCollapsed, setMiddlePanelCollapsed],
  )

  useEffect(() => {
    // Function to handle screen size changes
    const handleResize = () => {
      const isMobile = window.innerWidth < 768

      // On mobile, collapse both panels by default
      if (isMobile) {
        if (!leftPanelCollapsed) {
          toggleLeftPanel()
        }
        if (!middlePanelCollapsed) {
          toggleMiddlePanel()
        }
      }
    }

    // Call once on mount
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [leftPanelCollapsed, middlePanelCollapsed, toggleLeftPanel, toggleMiddlePanel])

  const folderDisplayName = selectedFolder ? selectedFolder.split("/").pop() : "Root"

  return (
    <ErrorBoundary>
      <div className="h-[100vh] w-full overflow-hidden" suppressHydrationWarning>
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full"
          onLayout={handlePanelResize}
          style={{ transition: "none" }}
        >
          {/* Folder Structure Panel */}
          <ResizablePanel
            defaultSize={getLeftPanelSize()}
            minSize={leftPanelCollapsed ? 3 : 15}
            maxSize={leftPanelCollapsed ? 3 : 40}
            collapsible={false}
            className={cn("border-r flex flex-col overflow-hidden")}
          >
            <FolderPanel
              folderStructure={folderStructure}
              selectedFolder={selectedFolder}
              expandedFolders={expandedFolders}
              loading={loading.structure}
              collapsed={leftPanelCollapsed}
              togglePanel={toggleLeftPanel}
              selectFolder={handleFolderSelect}
              toggleFolder={toggleFolder}
            />
          </ResizablePanel>

          {!middlePanelCollapsed && <ResizableHandle withHandle />}

          {/* Files List Panel */}
          <ResizablePanel
            defaultSize={getMiddlePanelSize()}
            minSize={middlePanelCollapsed ? 3 : 15}
            maxSize={middlePanelCollapsed ? 3 : 40}
            collapsible={false}
            className={cn("border-r flex flex-col overflow-hidden")}
          >
            {!middlePanelCollapsed && (
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
                  className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
                  onClick={toggleMiddlePanel}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}

            <FilesPanel
              selectedFolder={selectedFolder}
              selectedFile={selectedFile}
              files={currentFolderFiles}
              pagination={pagination}
              loading={loading.files}
              collapsed={middlePanelCollapsed}
              togglePanel={toggleMiddlePanel}
              selectFile={selectFile}
              loadMoreFiles={loadMoreFiles}
            />
          </ResizablePanel>

          {!middlePanelCollapsed && <ResizableHandle withHandle />}

          {/* HTML Content Panel */}
          <ResizablePanel defaultSize={getRightPanelSize()} minSize={30} className="flex flex-col">
            <ContentPanel
              selectedFile={selectedFile}
              fileContent={fileContent}
              fileMetadata={fileMetadata}
              fileHasAttachments={fileHasAttachments}
              loading={contentLoading}
              tocItems={tocItems}
              showToc={showToc}
              setShowToc={setShowToc}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </ErrorBoundary>
  )
}

