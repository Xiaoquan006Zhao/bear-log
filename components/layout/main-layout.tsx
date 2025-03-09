"use client"

import { useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { FolderPanel } from "@/components/panels/folder-panel"
import { FilesPanel } from "@/components/panels/files-panel"
import { ContentPanel } from "@/components/panels/content-panel"
import { ErrorBoundary } from "@/components/error-boundary"
import { useAppState } from "@/context/app-state-context"

export function MainLayout() {
  // Get state from context
  const {
    // Folder Structure
    folderStructure,
    selectedFolder,
    expandedFolders,
    currentFolderFiles,
    folderLoading,
    pagination,
    selectFolder,
    toggleFolder,
    loadMoreFiles,

    // File Content
    selectedFile,
    fileContent,
    rawHtml,
    fileMetadata,
    fileHasAttachments,
    contentLoading,
    tocItems,
    showToc,
    loadFileContent,
    setShowToc,

    // Panel State
    leftPanelCollapsed,
    middlePanelCollapsed,
    toggleLeftPanel,
    toggleMiddlePanel,
    setMiddlePanelCollapsed,
  } = useAppState()

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

  // Calculate panel sizes based on collapse state
  const getLeftPanelSize = useCallback(() => {
    return leftPanelCollapsed ? 3 : 15
  }, [leftPanelCollapsed])

  const getMiddlePanelSize = useCallback(() => {
    return middlePanelCollapsed ? 3 : 15
  }, [middlePanelCollapsed])

  const getRightPanelSize = useCallback(() => {
    const leftSize = getLeftPanelSize()
    const middleSize = getMiddlePanelSize()
    return 100 - leftSize - middleSize
  }, [getLeftPanelSize, getMiddlePanelSize])

  // Handle panel resizing
  const handlePanelResize = useCallback((sizes: number[]) => {
    // Implementation depends on the existing usePanelState hook
    console.log("Panel resized:", sizes)
  }, [])

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
              loading={folderLoading.structure}
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
            <FilesPanel
              selectedFolder={selectedFolder}
              selectedFile={selectedFile}
              files={currentFolderFiles}
              pagination={pagination}
              loading={folderLoading.files}
              collapsed={middlePanelCollapsed}
              togglePanel={toggleMiddlePanel}
              selectFile={selectFile}
              loadMoreFiles={loadMoreFiles}
            />
          </ResizablePanel>

          {!middlePanelCollapsed && <ResizableHandle withHandle />}

          {/* HTML Content Panel */}
          <ResizablePanel defaultSize={getRightPanelSize()} minSize={30} className="flex flex-col overflow-hidden">
            <ContentPanel
              selectedFile={selectedFile}
              fileContent={fileContent}
              rawHtml={rawHtml}
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

