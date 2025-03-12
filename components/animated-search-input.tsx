// animated-search-input.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedSearchInputProps {
  value: string
  onChange: any
  onClear?: () => void
  onExpandChange?: (expanded: boolean) => void
}

export default function AnimatedSearchInput({ value, onChange, onClear, onExpandChange }: AnimatedSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearchIconClick = () => {
    setIsExpanded(true)
    if (onExpandChange) {
      onExpandChange(true)
    }
  }

  const handleClearClick = () => {
    if (typeof onClear === "function") {
      onClear()
    } else if (typeof onChange === "function") {
      try {
        onChange({ target: { value: "" } })
      } catch (e) {
        console.error("Failed to clear input via onChange", e)
      }
    }

    if (inputRef.current) {
      inputRef.current.value = ""
    }

    setIsExpanded(false)
    if (onExpandChange) {
      onExpandChange(false)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node) && value === "") {
      setIsExpanded(false)
      if (onExpandChange) {
        onExpandChange(false)
      }
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [value])

  return (
    <div className="relative flex items-center">
      <div
        ref={containerRef}
        className={cn(
          "flex items-center h-8 rounded-full border border-input bg-background transition-all duration-50 ease-in-out origin-right",
          isExpanded ? "w-full" : "w-8",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center h-full aspect-square transition-all",
            isExpanded ? "opacity-0 w-0" : "opacity-100 w-8",
          )}
        >
          <button
            type="button"
            onClick={handleSearchIconClick}
            className="flex items-center justify-center h-full w-full cursor-pointer rounded-full text-muted-foreground hover:text-foreground"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 h-full transition-all duration-50",
            isExpanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none",
          )}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={value}
            onChange={onChange}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleClearClick()
              }
            }}
            className="h-full w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none pl-3 pr-8 text-sm"
          />
        </div>

        {isExpanded && (
          <button
            type="button"
            onClick={handleClearClick}
            className="absolute right-2 flex items-center cursor-pointer justify-center h-4 w-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
