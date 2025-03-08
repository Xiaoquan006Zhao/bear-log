"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ExportButtonProps {
  filename: string
  content: string
  disabled?: boolean
}

export function ExportButton({ filename, content, disabled = false }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = (format: "html" | "markdown" | "text") => {
    setExporting(true)

    try {
      let exportContent = content
      let exportFilename = filename
      let mimeType = "text/html"

      if (format === "markdown") {
        // Simple HTML to Markdown conversion
        exportContent = convertToMarkdown(content)
        exportFilename = filename.replace(".html", ".md")
        mimeType = "text/markdown"
      } else if (format === "text") {
        // Simple HTML to text conversion
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = content
        exportContent = tempDiv.textContent || tempDiv.innerText || ""
        exportFilename = filename.replace(".html", ".txt")
        mimeType = "text/plain"
      }

      // Create blob and download
      const blob = new Blob([exportContent], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = exportFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting file:", error)
      alert("Failed to export file")
    } finally {
      setExporting(false)
    }
  }

  // Simple HTML to Markdown converter
  const convertToMarkdown = (html: string): string => {
    // This is a very basic converter - for a real app, use a library
    let markdown = html

    // Replace headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")

    // Replace paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")

    // Replace lists
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1\n")
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, "$1\n")
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")

    // Replace links
    markdown = markdown.replace(/<a[^>]*href="(.*?)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")

    // Replace images
    markdown = markdown.replace(/<img[^>]*src="(.*?)"[^>]*>/gi, "![]($1)")

    // Remove other HTML tags
    markdown = markdown.replace(/<[^>]*>/g, "")

    return markdown
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" disabled={disabled || exporting}>
          <Download className="h-4 w-4" />
          <span className="sr-only">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("html")}>Export as HTML</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("markdown")}>Export as Markdown</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("text")}>Export as Text</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

