"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Folder, ChevronRight, ChevronDown, ChevronLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FolderNode } from "@/hooks/use-folder-structure"
import { ThemeToggle } from "@/components/theme-toggle"

interface FolderPanelProps {
  folderStructure: FolderNode | null
  selectedFolder: string
  expandedFolders: Set<string>
  loading: boolean
  collapsed: boolean
  togglePanel: () => void
  selectFolder: (path: string) => void
  toggleFolder: (path: string) => void
}

export function FolderPanel({
  folderStructure,
  selectedFolder,
  expandedFolders,
  loading,
  collapsed,
  togglePanel,
  selectFolder,
  toggleFolder,
}: FolderPanelProps) {
  // Render folder structure recursively
  const renderFolderStructure = (node: FolderNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path)
    const isSelected = selectedFolder === node.path

    // Skip rendering the root node itself
    if (node.name === "root") {
      return (
        <div key={node.path} className="space-y-1">
          {Object.values(node.children)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((childNode) => renderFolderStructure(childNode, level))}
        </div>
      )
    }

    return (
      <div key={node.path} className={`${level > 0 ? "ml-3" : ""}`}>
        <div className="flex items-center group hover-highlight rounded-md mb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={() => toggleFolder(node.path)}
            disabled={Object.keys(node.children).length === 0}
          >
            {Object.keys(node.children).length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4" />
            )}
          </Button>
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            className={`flex-1 justify-start text-left h-8 py-1 pl-1 pr-2 min-w-0 rounded-md ${
              isSelected ? "bg-secondary" : "bg-transparent"
            }`}
            onClick={() => selectFolder(node.path)}
            title={node.name}
          >
            <Folder className={`h-4 w-4 mr-2 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
            <span className={cn("truncate", collapsed && "hidden")}>{node.name}</span>
            {node.totalUniqueFiles > 0 && !collapsed && (
              <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                {node.totalUniqueFiles}
              </Badge>
            )}
          </Button>
        </div>

        {isExpanded && Object.keys(node.children).length > 0 && (
          <div className="mt-1 space-y-1">
            {Object.values(node.children)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((childNode) => renderFolderStructure(childNode, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="h-full bg-muted/50 flex flex-col">
        <div className="p-4 flex-shrink-0 flex justify-center border-b">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center"
            onClick={togglePanel}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1"></div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-3 border-b flex-shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-3">
          <ThemeToggle /> {/* Replace Folder icon with ThemeToggle */}
          <span className="truncate">Folders</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex items-center justify-center flex-shrink-0"
          onClick={togglePanel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0" orientation="both">
          <div className="p-3">
            {loading ? (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading folders...</span>
              </div>
            ) : folderStructure ? (
              <div className="min-w-[200px]">{renderFolderStructure(folderStructure)}</div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No folders found</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

