"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bug } from "lucide-react"
import { useAppState } from "@/context/app-state-context"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { folderStructure, selectedFolder, currentFolderFiles, folderLoading, pagination } = useAppState()

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50" onClick={() => setIsOpen(true)}>
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto bg-background border rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Debug Panel</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Selected Folder</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">{selectedFolder || "root"}</pre>
        </div>

        <div>
          <h4 className="font-medium mb-1">Loading State</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(folderLoading, null, 2)}</pre>
        </div>

        <div>
          <h4 className="font-medium mb-1">Pagination</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(pagination, null, 2)}</pre>
        </div>

        <div>
          <h4 className="font-medium mb-1">Files in Current Folder</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(
              currentFolderFiles.map((f) => ({ file: f.file, title: f.metadata.title })),
              null,
              2,
            )}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-1">Actions</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                try {
                  const response = await fetch("/data/folder-structure.json")
                  const data = await response.json()
                  console.log("Folder structure:", data)
                  alert("Folder structure logged to console")
                } catch (error) {
                  console.error("Error fetching folder structure:", error)
                  alert(`Error: ${error.message}`)
                }
              }}
            >
              Check Folder Structure
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                try {
                  const response = await fetch(`/data/folder-${encodeURIComponent(selectedFolder || "root")}.json`)
                  const data = await response.json()
                  console.log("Folder files:", data)
                  alert(`Found ${data.files?.length || 0} files`)
                } catch (error) {
                  console.error("Error fetching folder files:", error)
                  alert(`Error: ${error.message}`)
                }
              }}
            >
              Check Current Folder Files
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

