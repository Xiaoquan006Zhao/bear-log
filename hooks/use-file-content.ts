"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getFileContent, type HtmlMetadata } from "@/lib/file-utils"
import { generateTableOfContents, type TocItem } from "@/lib/toc-utils"
import storage from "@/lib/local-storage"

// Define a cache entry type without the content variable
interface CacheEntry {
  rawHtml: string
  metadata: HtmlMetadata
  hasAttachments: boolean
  tocItems: TocItem[]
  timestamp: number
}

// Maximum number of files to keep in cache
const MAX_CACHE_SIZE = 20
const CACHE_STORAGE_KEY = "file-content-cache"

export function useFileContent() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [rawHtml, setRawHtml] = useState<string>("")
  const [fileMetadata, setFileMetadata] = useState<HtmlMetadata | null>(null)
  const [fileHasAttachments, setFileHasAttachments] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(false)

  // Use a ref for the cache to avoid re-renders when cache changes
  const contentCache = useRef<Map<string, CacheEntry>>(new Map())

  // Function to clear the cache (useful for debugging or manual cleanup)
  const clearCache = useCallback(() => {
    contentCache.current.clear()
    storage.remove(CACHE_STORAGE_KEY)
    console.log("Content cache cleared")
  }, [])

  // Clear cache on component mount
  useEffect(() => {
    clearCache()
  }, [clearCache])

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const cachedData = storage.get(CACHE_STORAGE_KEY, null)
      if (cachedData) {
        const cacheMap = new Map<string, CacheEntry>()

        // Only restore the most recent MAX_CACHE_SIZE entries
        const entries = Object.entries(cachedData)
          .sort((a, b) => (b[1] as CacheEntry).timestamp - (a[1] as CacheEntry).timestamp)
          .slice(0, MAX_CACHE_SIZE)

        entries.forEach(([key, value]) => {
          cacheMap.set(key, value as CacheEntry)
        })

        contentCache.current = cacheMap
        console.log(`Restored ${cacheMap.size} cache entries from localStorage`)
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error)
    }
  }, [])

  // Save cache to localStorage when it changes
  const saveCache = useCallback(() => {
    try {
      const cache = contentCache.current
      if (cache.size > 0) {
        // Convert Map to object for storage
        const cacheObject = Object.fromEntries(cache.entries())
        storage.set(CACHE_STORAGE_KEY, cacheObject)
      }
    } catch (error) {
      console.error("Error saving cache to localStorage:", error)
    }
  }, [])

  // Function to clean up old cache entries if cache exceeds max size
  const cleanupCache = useCallback(() => {
    const cache = contentCache.current
    if (cache.size <= MAX_CACHE_SIZE) return

    // Convert to array to sort by timestamp
    const entries = Array.from(cache.entries())
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    // Remove oldest entries until we're under the limit
    const entriesToRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)

    entriesToRemove.forEach(([key]) => {
      cache.delete(key)
    })

    console.log(`Cleaned up ${entriesToRemove.length} old cache entries`)

    // Save updated cache to localStorage
    saveCache()
  }, [saveCache])

  // Load content for selected file with caching
  const loadFileContent = useCallback(
    async (filename: string) => {
      if (!filename) return

      setLoading(true)
      setSelectedFile(filename)

      try {
        // Check if we have this file in cache
        const cache = contentCache.current
        const cachedEntry = cache.get(filename)

        if (cachedEntry) {
          console.log(`Loading ${filename} from cache`)
          // Update the timestamp to mark this as recently used
          cachedEntry.timestamp = Date.now()

          // Use cached data
          setRawHtml(cachedEntry.rawHtml)
          
          setFileMetadata(cachedEntry.metadata)
          setFileHasAttachments(cachedEntry.hasAttachments)
          setTocItems(cachedEntry.tocItems)

          // Save updated cache timestamps
          saveCache()

          // Return early, no need to fetch from server
          setLoading(false)
          return
        }

        // Not in cache, fetch from server
        console.log(`Fetching ${filename} from server`)
        const { content, metadata, hasAttachments, rawHtml } = await getFileContent(filename)

        // Generate table of contents from the processed content
        const toc = generateTableOfContents(content)

        // Update state (only rawHtml is stored)
        setRawHtml(rawHtml)
        setFileMetadata(metadata)
        setFileHasAttachments(hasAttachments)
        setTocItems(toc)

        // Add to cache (no content stored)
        cache.set(filename, {
          rawHtml,
          metadata,
          hasAttachments,
          tocItems: toc,
          timestamp: Date.now(),
        })

        // Clean up old cache entries if needed
        cleanupCache()

        // Save updated cache to localStorage
        saveCache()
      } catch (error) {
        console.error("Error loading file content:", error)
        setRawHtml("<p>Error loading file content</p>")
        setFileMetadata(null)
        setFileHasAttachments(false)
        setTocItems([])
      } finally {
        setLoading(false)
      }
    },
    [cleanupCache, saveCache],
  )

  // Load showToc preference from localStorage on mount
  useEffect(() => {
    const savedShowToc = storage.get("showToc", false)
    if (typeof savedShowToc === "boolean") {
      setShowToc(savedShowToc)
    }
  }, [])

  // Save showToc preference to localStorage when it changes
  const setShowTocWithStorage = useCallback((value: boolean) => {
    setShowToc(value)
    storage.set("showToc", value)
  }, [])

  return {
    selectedFile,
    rawHtml,
    fileMetadata,
    fileHasAttachments,
    loading,
    tocItems,
    showToc,
    loadFileContent,
    setShowToc: setShowTocWithStorage,
    clearCache, // Expose this for debugging or manual cleanup
  }
}