"use client"

import { useState } from "react"

interface ImagePreviewGridProps {
  images: string[]
  maxHeight?: number
}

export function ImagePreviewGrid({ images, maxHeight }: ImagePreviewGridProps) {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  if (!images.length) return null

  const handleImageError = (index: number) => {
    console.log(`Image at index ${index} failed to load:`, images[index])
    setImageErrors((prev) => ({
      ...prev,
      [index]: true,
    }))
  }

  // Extract filename from path for fallback display
  const getFilenameFromPath = (path: string) => {
    // Remove API path prefix if present
    const cleanPath = path.replace(/^\/api\/attachments\/[^/]+\//, "")
    // Get the last part of the path (filename)
    return decodeURIComponent(cleanPath)
  }

  return (
    <div className="h-full w-full">
      <div className="flex gap-0.5 h-full" style={{ maxHeight: maxHeight }}>
        {images.map((src, index) => (
          <div
            key={index}
            className="relative bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0"
            style={{ height: "100%" }}
          >
            {imageErrors[index] ? (
              <div className="h-full w-full flex items-center justify-center p-2 text-xs text-muted-foreground break-all">
                {getFilenameFromPath(src)}
              </div>
            ) : (
              <img
                src={src || "/placeholder.svg"}
                alt={`Preview ${index + 1}`}
                className="h-full w-auto"
                style={{
                  objectFit: "cover",
                  minWidth: "100%",
                }}
                onError={() => handleImageError(index)}
                onLoad={() => console.log(`Image loaded successfully: ${src}`)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

