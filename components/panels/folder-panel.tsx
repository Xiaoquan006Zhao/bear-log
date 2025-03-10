"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import type { FolderNode } from "@/hooks/use-folder-structure"
import { FolderItem } from "@/components/panels/folder-item"
import { SocialLinks } from "@/components/social-links"

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
  if (collapsed) {
    return (
      <div className="h-full bg-muted/50 flex flex-col">
        <div className="p-4 shrink-0 flex justify-center border-b">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center cursor-pointer"
            onClick={togglePanel}
          >
            <ChevronRight className="h-4 w-4 " />
          </Button>
        </div>
        <div className="flex-1"></div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-3 min-w-0 overflow-hidden">
          
          <span className="truncate overflow-hidden text-ellipsis">Xiaoquan's Notes</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 ml-2 flex items-center justify-center shrink-0 cursor-pointer"
          onClick={togglePanel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-b">
        <SocialLinks collapsed={collapsed} />
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
              <div className="min-w-[200px]">
                <FolderStructure
                  node={folderStructure}
                  selectedFolder={selectedFolder}
                  expandedFolders={expandedFolders}
                  selectFolder={selectFolder}
                  toggleFolder={toggleFolder}
                />
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">No folders found</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

function FolderStructure({
  node,
  selectedFolder,
  expandedFolders,
  selectFolder,
  toggleFolder,
}: {
  node: FolderNode
  selectedFolder: string
  expandedFolders: Set<string>
  selectFolder: (path: string) => void
  toggleFolder: (path: string) => void
}) {
  // Skip rendering the root node itself
  if (node.name === "root") {
    return (
      <div className="space-y-1">
        {Object.values(node.children)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((childNode) => (
            <FolderItem
              key={childNode.path}
              node={childNode}
              level={0}
              selectedFolder={selectedFolder}
              expandedFolders={expandedFolders}
              selectFolder={selectFolder}
              toggleFolder={toggleFolder}
            />
          ))}
      </div>
    )
  }

  return null
}

