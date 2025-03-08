"use client"

import { useState, useCallback } from "react"
import { getFileContent, type HtmlMetadata } from "@/lib/file-utils"
import { generateTableOfContents, type TocItem } from "@/lib/toc-utils"

export function useFileContent() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [fileMetadata, setFileMetadata] = useState<HtmlMetadata | null>(null)
  const [fileHasAttachments, setFileHasAttachments] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(false)

  // Load content for selected file
  const loadFileContent = useCallback(async (filename: string) => {
    if (!filename) return

    setLoading(true)
    setSelectedFile(filename)

    try {
      const { content, metadata, hasAttachments } = await getFileContent(filename)

      // Add error handling for images in the HTML content
      const processedContent = addImageErrorHandling(content)

      setFileContent(processedContent)
      setFileMetadata(metadata)
      setFileHasAttachments(hasAttachments)
      // Generate table of contents
      const toc = generateTableOfContents(processedContent)
      setTocItems(toc)
    } catch (error) {
      console.error("Error loading file content:", error)
      setFileContent("<p>Error loading file content</p>")
      setFileMetadata(null)
      setFileHasAttachments(false)
      setTocItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Add error handling to images in HTML content
  const addImageErrorHandling = (htmlContent: string): string => {
    // Add onerror attribute to img tags to show the src as text when image fails to load
    return htmlContent.replace(
      /<img([^>]*)src=["']([^"']+)["']([^>]*)>/gi,
      "<img$1src=\"$2\"$3 onerror=\"this.style.display='none'; this.insertAdjacentHTML('afterend', '<div class=\\'text-xs text-muted-foreground p-2 break-all bg-gray-100 dark:bg-gray-900 rounded border\\'>$2</div>');\">",
    )
  }

  return {
    selectedFile,
    fileContent,
    fileMetadata,
    fileHasAttachments,
    loading,
    tocItems,
    showToc,
    loadFileContent,
    setShowToc,
  }
}

