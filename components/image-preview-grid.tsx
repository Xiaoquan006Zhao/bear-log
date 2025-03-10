"use client"

import { useState, useCallback } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ImagePreviewGridProps {
  images: string[]
  maxHeight?: number
}

export function ImagePreviewGrid({ images, maxHeight = 200 }: ImagePreviewGridProps) {
  const [imageStates, setImageStates] = useState<Record<number, "loading" | "error" | "loaded">>(() => {
    // Initialize all images as loading
    const states: Record<number, "loading" | "error" | "loaded"> = {}
    images.forEach((_, index) => {
      states[index] = "loading"
    })
    return states
  })

  const handleImageError = useCallback((index: number) => {
    setImageStates((prev) => ({
      ...prev,
      [index]: "error",
    }))
  }, [])

  const handleImageLoad = useCallback((index: number) => {
    setImageStates((prev) => ({
      ...prev,
      [index]: "loaded",
    }))
  }, [])

  // Extract filename from path for fallback display
  const getFilenameFromPath = (path: string) => {
    // Remove API path prefix if present since we have changed to static website
    const cleanPath = path.replace(/^\/api\/attachments\/[^/]+\//, "")
    // Get the last part of the path (filename)
    return decodeURIComponent(cleanPath)
  }

  if (!images.length) return null

  return (
    <div className="h-full w-full">
      <div className="flex gap-0.5 h-full">
        {images.map((src, index) => (
          <div
            key={index}
            className="relative bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0"
            style={{ height: "100%" }}
          >
            {imageStates[index] === "error" ? (
              <div className="h-full w-full flex items-center justify-center p-2 text-xs text-muted-foreground break-all">
                {getFilenameFromPath(src)}
              </div>
            ) : (
              <>
                {imageStates[index] === "loading" && <Skeleton className="absolute inset-0 bg-muted animate-pulse" />}
                <img
                  src={src || "/placeholder.svg"}
                  alt={`Preview ${index + 1}`}
                  className={`h-full w-auto ${imageStates[index] === "loading" ? "opacity-0" : "opacity-100"}`}
                  style={{
                    objectFit: "cover",
                    minWidth: "100%",
                    transition: "opacity 0.3s ease-in-out",
                  }}
                  onError={() => handleImageError(index)}
                  onLoad={() => handleImageLoad(index)}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

