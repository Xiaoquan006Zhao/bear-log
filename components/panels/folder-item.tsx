"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Folder, ChevronRight, ChevronDown } from "lucide-react"
import type { FolderNode } from "@/hooks/use-folder-structure"

interface FolderItemProps {
  node: FolderNode
  level: number
  selectedFolder: string
  expandedFolders: Set<string>
  selectFolder: (path: string) => void
  toggleFolder: (path: string) => void
}

export function FolderItem({
  node,
  level,
  selectedFolder,
  expandedFolders,
  selectFolder,
  toggleFolder,
}: FolderItemProps) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedFolder === node.path

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
          <span className="truncate">{node.name}</span>
          {node.totalUniqueFiles > 0 && (
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
            .map((childNode) => (
              <FolderItem
                key={childNode.path}
                node={childNode}
                level={level + 1}
                selectedFolder={selectedFolder}
                expandedFolders={expandedFolders}
                selectFolder={selectFolder}
                toggleFolder={toggleFolder}
              />
            ))}
        </div>
      )}
    </div>
  )
}

