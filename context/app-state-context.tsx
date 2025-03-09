"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useFolderStructure } from "@/hooks/use-folder-structure"
import { useFileContent } from "@/hooks/use-file-content"
import { usePanelState } from "@/hooks/use-panel-state"

interface AppStateContextType {
  // Folder Structure State
  folderStructure: any
  selectedFolder: string
  expandedFolders: Set<string>
  currentFolderFiles: any[]
  folderLoading: { structure: boolean; files: boolean }
  pagination: { page: number; hasMore: boolean; total: number; loading: boolean }
  selectFolder: (path: string) => void
  toggleFolder: (path: string) => void
  loadMoreFiles: () => void

  // File Content State
  selectedFile: string | null
  fileContent: string
  rawHtml: string
  fileMetadata: any | null
  fileHasAttachments: boolean
  contentLoading: boolean
  tocItems: any[]
  showToc: boolean
  loadFileContent: (filename: string) => void
  setShowToc: (show: boolean) => void

  // Panel State
  leftPanelCollapsed: boolean
  middlePanelCollapsed: boolean
  toggleLeftPanel: () => void
  toggleMiddlePanel: () => void
  setMiddlePanelCollapsed: (collapsed: boolean) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Initialize hooks
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
    rawHtml,
  } = useFileContent()

  // Callback for file selection
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
    loading: folderLoading,
    pagination,
    selectFolder,
    toggleFolder,
    loadMoreFiles,
  } = useFolderStructure(handleFileSelect)

  // Create context value object
  const contextValue = useMemo(
    () => ({
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
    }),
    [
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
    ],
  )

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return context
}

