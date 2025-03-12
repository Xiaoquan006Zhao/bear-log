"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedSearchInputProps {
  value: string
  onChange: any
  onClear?: () => void
}

export default function AnimatedSearchInput({ value, onChange, onClear }: AnimatedSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearchIconClick = () => {
    setIsExpanded(true)
    // Focus the input after expanding
    setTimeout(() => {
      inputRef.current?.focus()
    }, 150)
  }

  const handleClearClick = () => {
    // Use the dedicated onClear handler if provided
    if (typeof onClear === "function") {
      onClear()
    }
    setIsExpanded(false)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node) && value === "") {
      setIsExpanded(false)
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
          "flex items-center h-8 rounded-full border border-input bg-background transition-all duration-200 ease-out origin-right",
          isExpanded ? "w-full min-w-[120px]" : "w-8",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center h-full transition-opacity duration-150",
            isExpanded ? "opacity-0 w-0 absolute" : "opacity-100 w-8 relative",
          )}
        >
          <button
            type="button"
            onClick={handleSearchIconClick}
            className="flex items-center justify-center h-full w-full rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 h-full transition-all duration-200 ease-in-out",
            isExpanded ? "opacity-100 visible" : "opacity-0 invisible absolute",
          )}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={value}
            onChange={onChange}
            className="h-full w-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none pl-3 pr-8 text-sm"
          />
        </div>

        {isExpanded && (
          <button
            type="button"
            onClick={handleClearClick}
            className="absolute right-2 flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}

