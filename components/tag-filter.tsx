"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Tag } from "lucide-react"

interface TagFilterProps {
  files: { metadata: { tags: string } }[]
  onFilterChange: (tags: string[]) => void
}

export function TagFilter({ files, onFilterChange }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Extract unique tags from files
  useEffect(() => {
    const tags = new Set<string>()

    files.forEach((file) => {
      if (file.metadata.tags) {
        const fileTags = file.metadata.tags.split(", ")
        fileTags.forEach((tag) => {
          // Get the leaf tag (last part after /)
          const parts = tag.split("/")
          const leafTag = parts[parts.length - 1]
          tags.add(leafTag)
        })
      }
    })

    setAvailableTags(Array.from(tags).sort())
  }, [files])

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]

      onFilterChange(newTags)
      return newTags
    })
  }

  // Clear all selected tags
  const clearTags = () => {
    setSelectedTags([])
    onFilterChange([])
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 flex items-center gap-1" onClick={() => setIsOpen(!isOpen)}>
          <Tag className="h-3.5 w-3.5" />
          <span>Tags</span>
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 h-5 min-w-5 flex items-center justify-center">
              {selectedTags.length}
            </Badge>
          )}
        </Button>

        {selectedTags.length > 0 && (
          <ScrollArea className="max-w-[300px]" orientation="horizontal">
            <div className="flex gap-1">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => toggleTag(tag)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={clearTags}>
                Clear
              </Button>
            </div>
          </ScrollArea>
        )}
      </div>

      {isOpen && availableTags.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-background border rounded-md shadow-md p-2 w-48">
          <ScrollArea className="h-48">
            <div className="space-y-1">
              {availableTags.map((tag) => (
                <div
                  key={tag}
                  className={`px-2 py-1 text-sm rounded cursor-pointer hover:bg-muted flex items-center justify-between ${
                    selectedTags.includes(tag) ? "bg-muted" : ""
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  <span className="truncate">{tag}</span>
                  {selectedTags.includes(tag) && (
                    <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

