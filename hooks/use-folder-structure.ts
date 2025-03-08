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
      if (loading.files && !append) return

      setLoading((prev) => ({ ...prev, files: true }))
      setPagination((prev) => ({ ...prev, loading: true }))

      try {
        let result

        if (process.env.NODE_ENV === "production") {
          // In production, use the API route
          const response = await fetch(`/api/folder?path=${encodeURIComponent(folderPath)}&page=${page}&limit=20`)
          if (!response.ok) {
            throw new Error(`Failed to fetch folder files: ${folderPath}`)
          }
          result = await response.json()
        } else {
          // In development, use the existing function
          result = await getFilesForFolder(folderPath, page, 20)
        }

        if (append) {
          setCurrentFolderFiles((prev) => [...prev, ...result.files])
        } else {
          setCurrentFolderFiles(result.files)

          // Select first file if available
          if (result.files.length > 0) {
            onFileSelect(result.files[0].file)
          }
        }

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
    [loading.files, onFileSelect],
  )

  // Load more files when scrolling
  const loadMoreFiles = useCallback(() => {
    if (pagination.hasMore && !pagination.loading) {
      loadFolderFiles(selectedFolder, pagination.page + 1, true)
    }
  }, [pagination, selectedFolder, loadFolderFiles])

  // Handle folder selection
  const selectFolder = useCallback(
    (path: string) => {
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

      // Load files for this folder
      loadFolderFiles(path)
    },
    [loadFolderFiles],
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

