"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedSearchInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function AnimatedSearchInput({ value, onChange }: AnimatedSearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSearchIconClick = () => {
    setIsExpanded(true)
    // Focus the input after expanding
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleClearClick = () => {
    // Create a synthetic event to clear the input
    const event = {
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>

    onChange(event)
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
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center h-8 rounded-full border border-input bg-background transition-all duration-300 ease-in-out",
        isExpanded ? "w-40 md:w-48" : "w-8",
      )}
    >
      {!isExpanded && (
        <button
          type="button"
          onClick={handleSearchIconClick}
          className="flex items-center justify-center h-full w-full rounded-full text-muted-foreground hover:text-foreground transition-all"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      )}

      <input
        ref={inputRef}
        type="text"
        placeholder="Search..."
        value={value}
        onChange={onChange}
        className={cn(
          "h-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none transition-all duration-300 text-sm",
          isExpanded ? "w-full pl-3 pr-8 opacity-100" : "w-0 px-0 opacity-0 pointer-events-none",
        )}
      />

      {isExpanded && (
        <button
          type="button"
          onClick={handleClearClick}
          className="absolute right-2 flex items-center justify-center h-4 w-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

