"use client"

import { useState, useCallback, useEffect } from "react"
import { getFolderStructure, getFilesForFolder, type HtmlMetadata } from "@/lib/file-utils"

// Type for folder structure
export interface FolderNode {
  name: string
  path: string
  children: Record<string, FolderNode>
  files: string[]
  totalUniqueFiles: number
}

export function useFolderStructure(onFileSelect: (filename: string) => void) {
  const [folderStructure, setFolderStructure] = useState<FolderNode | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([""]))
  const [currentFolderFiles, setCurrentFolderFiles] = useState<
    { file: string; metadata: HtmlMetadata; imageAttachments?: string[] }[]
  >([])
  const [loading, setLoading] = useState({
    structure: true,
    files: false,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
    loading: false,
  })

  // Load folder structure on initial render
  useEffect(() => {
    const loadFolderStructure = async () => {
      setLoading((prev) => ({ ...prev, structure: true }))
      try {
        // Get folder structure from server
        const structure = await getFolderStructure()
        setFolderStructure(structure)

        // If root has files, load them
        if (structure.files.length > 0) {
          setSelectedFolder("")
          loadFolderFiles("")
        } else {
          // Otherwise, try to select the first folder
          const firstFolder = Object.values(structure.children)[0]
          if (firstFolder) {
            setSelectedFolder(firstFolder.path)
            setExpandedFolders(new Set([firstFolder.path]))
            loadFolderFiles(firstFolder.path)
          }
        }
      } catch (error) {
        console.error("Error loading folder structure:", error)
      } finally {
        setLoading((prev) => ({ ...prev, structure: false }))
      }
    }

    loadFolderStructure()
  }, [])

  // Load files for selected folder with pagination
  const loadFolderFiles = useCallback(
    async (folderPath: string, page = 1, append = false) => {
      // Prevent loading if already loading files and not appending
      if (loading.files && !append) return

      // Set loading states
      setLoading((prev) => ({ ...prev, files: true }))
      setPagination((prev) => ({ ...prev, loading: true }))

      try {
        const result = await getFilesForFolder(folderPath, page, 20)

        // Handle empty results
        if (result.files.length === 0) {
          setPagination({
            page,
            hasMore: false,
            total: result.total,
            loading: false,
          })

          if (!append) {
            setCurrentFolderFiles([])
          }

          setLoading((prev) => ({ ...prev, files: false }))
          return
        }

        if (append) {
          // When appending, add new files to the existing list
          setCurrentFolderFiles((prev) => {
            const newFiles = [...prev]

            // Filter out duplicates (in case of race conditions)
            result.files.forEach((file) => {
              if (!newFiles.some((existing) => existing.file === file.file)) {
                newFiles.push(file)
              }
            })

            return newFiles
          })

          // If we're at the end of the list and loading more, select the first new file
          const currentIndex = currentFolderFiles.findIndex((file) => file.file === result.files[0].file)
          if (currentIndex === -1 && result.files.length > 0) {
            // Only select if we're at the end of the current list
            const lastVisible = document.querySelector('.file-card[data-selected="true"]')
            if (lastVisible && lastVisible.getBoundingClientRect().bottom > window.innerHeight - 100) {
              onFileSelect(result.files[0].file)
            }
          }
        } else {
          // When not appending, replace the current list
          setCurrentFolderFiles(result.files)

          // Select first file if available
          if (result.files.length > 0) {
            onFileSelect(result.files[0].file)
          }
        }

        // Update pagination state
        setPagination({
          page,
          hasMore: result.hasMore,
          total: result.total,
          loading: false,
        })
      } catch (error) {
        console.error("Error loading folder files:", error)

        if (!append) {
          setCurrentFolderFiles([])
        }

        setPagination({
          page,
          hasMore: false,
          total: 0,
          loading: false,
        })
      } finally {
        setLoading((prev) => ({ ...prev, files: false }))
      }
    },
    [loading.files, onFileSelect, currentFolderFiles],
  )

  // Load more files when scrolling
  const loadMoreFiles = useCallback(() => {
    if (pagination.hasMore && !pagination.loading) {
      // Set loading state immediately to prevent multiple calls
      setPagination((prev) => ({ ...prev, loading: true }))
      loadFolderFiles(selectedFolder, pagination.page + 1, true)
    }
  }, [pagination.hasMore, pagination.loading, pagination.page, selectedFolder, loadFolderFiles])

  // Handle folder selection
  const selectFolder = useCallback(
    (path: string) => {
      // Don't reload if selecting the same folder
      if (path === selectedFolder) return

      setSelectedFolder(path)
      setPagination({
        page: 1,
        hasMore: false,
        total: 0,
        loading: false,
      })

      // Also expand the folder
      setExpandedFolders((prev) => {
        const newSet = new Set(prev)
        newSet.add(path)
        return newSet
      })

      // Clear current files before loading new ones
      setCurrentFolderFiles([])

      // Load files for this folder
      loadFolderFiles(path)
    },
    [selectedFolder, loadFolderFiles],
  )

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  return {
    folderStructure,
    selectedFolder,
    expandedFolders,
    currentFolderFiles,
    loading,
    pagination,
    loadFolderFiles,
    loadMoreFiles,
    selectFolder,
    toggleFolder,
  }
}

