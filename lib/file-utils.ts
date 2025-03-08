"use server"

import fs from "fs/promises"
import path from "path"
import { processHtmlContent, attachmentFolderExists, getImageAttachments } from "./attachment-utils"

import { CONTENTS_DIR } from "@/lib/utils"


export interface HtmlMetadata {
  title: string
  created: string
  modified: string
  tags: string
  uniqueId: string
  lastDevice: string
  [key: string]: string
}

// Get the list of HTML files in the contents directory
export async function getFilesList(): Promise<string[]> {
  try {
    // Read the contents directory
    const files = await fs.readdir(CONTENTS_DIR)

    // Filter for HTML files only and remove the "public/" prefix in production
    return files
      .filter((file) => file.toLowerCase().endsWith(".html"))
      .map((file) => file.replace(/^public\/contents\//, ""))
  } catch (error) {
    console.error("Error reading contents directory:", error)
    return []
  }
}

// Get the content of a specific HTML file and extract metadata
export async function getFileContent(filename: string): Promise<{
  content: string
  metadata: HtmlMetadata
  rawHtml: string
  hasAttachments: boolean
}> {
  try {
    // Validate that we're only reading .html files
    if (!filename.toLowerCase().endsWith(".html")) {
      throw new Error("Only HTML files are supported")
    }

    const filePath = path.join(CONTENTS_DIR, filename)

    // In production, we need to fetch the file via HTTP
    let rawHtml
    if (process.env.NODE_ENV === "production") {
      // Use fetch to get the file content from the public URL
      const response = await fetch(`/contents/${filename}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${filename}`)
      }
      rawHtml = await response.text()
    } else {
      // In development, use fs as before
      rawHtml = await fs.readFile(filePath, "utf-8")
    }

    // Extract metadata from HTML
    const metadata = extractMetadata(rawHtml)

    // Check if this file has an attachments folder
    const hasAttachments = await attachmentFolderExists(filename)

    console.log(`File ${filename} has attachments: ${hasAttachments}`)

    // Process HTML content to fix attachment paths if needed
    const processedContent = hasAttachments ? await processHtmlContent(rawHtml, filename) : rawHtml

    return {
      content: processedContent,
      metadata,
      rawHtml,
      hasAttachments,
    }
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error)
    throw new Error(`Failed to read file: ${filename}`)
  }
}

// Extract metadata from HTML content
function extractMetadata(html: string): HtmlMetadata {
  const metadata: HtmlMetadata = {
    title: "",
    created: "",
    modified: "",
    tags: "",
    uniqueId: "",
    lastDevice: "",
  }

  // Extract title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    metadata.title = titleMatch[1]
  }

  // Extract meta tags
  const metaRegex = /<meta\s+name=["']([^"']+)["']\s+content=["']([^"']+)["']/gi
  let match

  while ((match = metaRegex.exec(html)) !== null) {
    const name = match[1].toLowerCase()
    const content = match[2]

    switch (name) {
      case "created":
        metadata.created = content
        break
      case "modified":
        metadata.modified = content
        break
      case "tags":
        metadata.tags = content
        break
      case "bear-note-unique-identifier":
        metadata.uniqueId = content
        break
      case "last device":
        metadata.lastDevice = content
        break
      default:
        metadata[name] = content
    }
  }

  return metadata
}

// Get paginated list of HTML files
export async function getPaginatedFilesList(
  page = 1,
  limit = 20,
): Promise<{
  files: string[]
  total: number
  hasMore: boolean
}> {
  try {
    // Read the contents directory
    const files = await fs.readdir(CONTENTS_DIR)

    // Filter for HTML files only
    const htmlFiles = files.filter((file) => file.toLowerCase().endsWith(".html"))

    // Calculate pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = htmlFiles.slice(startIndex, endIndex)

    return {
      files: paginatedFiles,
      total: htmlFiles.length,
      hasMore: endIndex < htmlFiles.length,
    }
  } catch (error) {
    console.error("Error reading contents directory:", error)
    return { files: [], total: 0, hasMore: false }
  }
}

// Get only file metadata without full content
export async function getFileMetadataOnly(filename: string): Promise<HtmlMetadata> {
  try {
    // Validate that we're only reading .html files
    if (!filename.toLowerCase().endsWith(".html")) {
      throw new Error("Only HTML files are supported")
    }

    const filePath = path.join(CONTENTS_DIR, filename)

    // Instead of using streams, read a small portion of the file
    // This approach is more compatible with Next.js server components
    const buffer = Buffer.alloc(8192) // 8KB buffer
    const fileHandle = await fs.open(filePath, "r")

    try {
      const { bytesRead } = await fileHandle.read(buffer, 0, 8192, 0)
      const headerHtml = buffer.subarray(0, bytesRead).toString()

      // Extract metadata from the header portion
      const metadata = extractMetadata(headerHtml)
      return metadata
    } finally {
      // Make sure we always close the file handle
      await fileHandle.close()
    }
  } catch (error) {
    console.error(`Error reading metadata for ${filename}:`, error)
    return {
      title: filename,
      created: "",
      modified: "",
      tags: "",
      uniqueId: "",
      lastDevice: "",
    }
  }
}

// Get folder structure based on file tags
export async function getFolderStructure(): Promise<any> {
  try {
    const files = await fs.readdir(CONTENTS_DIR)
    const htmlFiles = files.filter((file) => file.toLowerCase().endsWith(".html"))

    // Build folder structure based on tags
    const root = {
      name: "root",
      path: "",
      children: {},
      files: [],
      totalUniqueFiles: 0,
    }

    // Process files in batches to avoid memory issues
    const batchSize = 50
    for (let i = 0; i < htmlFiles.length; i += batchSize) {
      const batch = htmlFiles.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (file) => {
          try {
            const metadata = await getFileMetadataOnly(file)

            // Add files without tags to root
            if (!metadata.tags || metadata.tags.trim() === "") {
              root.files.push(file)
              return
            }

            // Process tags to build folder structure
            const tagsList = metadata.tags.split(", ")
            for (const tagPath of tagsList) {
              const parts = tagPath.split("/")
              let currentNode = root
              let currentPath = ""

              for (let j = 0; j < parts.length; j++) {
                const part = parts[j]
                currentPath = currentPath ? `${currentPath}/${part}` : part

                if (!currentNode.children[part]) {
                  currentNode.children[part] = {
                    name: part,
                    path: currentPath,
                    children: {},
                    files: [],
                    totalUniqueFiles: 0,
                  }
                }

                currentNode = currentNode.children[part]

                // Only add the file to the leaf folder
                if (j === parts.length - 1 && !currentNode.files.includes(file)) {
                  currentNode.files.push(file)
                }
              }
            }
          } catch (error) {
            console.error(`Error processing file ${file}:`, error)
          }
        }),
      )
    }

    // Calculate file counts correctly by tracking unique files
    const calculateFileCounts = (node) => {
      // Create a Set to track unique files in this node and all its children
      const uniqueFiles = new Set(node.files)

      // Recursively process all children and collect their unique files
      for (const childKey in node.children) {
        const childNode = node.children[childKey]
        const childUniqueFiles = calculateFileCounts(childNode)

        // Add all unique files from the child to this node's set
        childUniqueFiles.forEach((file) => uniqueFiles.add(file))
      }

      // Set the total count and return the set of unique files for parent processing
      node.totalUniqueFiles = uniqueFiles.size
      return uniqueFiles
    }

    calculateFileCounts(root)

    return root
  } catch (error) {
    console.error("Error building folder structure:", error)
    return {
      name: "root",
      path: "",
      children: {},
      files: [],
      totalUniqueFiles: 0,
    }
  }
}

// Get files for a specific folder
export async function getFilesForFolder(
  folderPath: string,
  page = 1,
  limit = 20,
): Promise<{
  files: { file: string; metadata: HtmlMetadata; hasAttachments: boolean; imageAttachments: string[] }[]
  total: number
  hasMore: boolean
}> {
  try {
    const folderStructure = await getFolderStructure()

    // Find the selected folder
    let currentNode = folderStructure
    if (folderPath !== "") {
      const parts = folderPath.split("/")
      for (const part of parts) {
        if (currentNode.children[part]) {
          currentNode = currentNode.children[part]
        } else {
          throw new Error(`Folder ${folderPath} not found`)
        }
      }
    }

    // Collect all files from this folder and subfolders
    const allFiles = new Set<string>()

    const collectFiles = (node) => {
      // Add this folder's files to the set
      node.files.forEach((file) => allFiles.add(file))

      // Process all children
      for (const childKey in node.children) {
        collectFiles(node.children[childKey])
      }
    }

    collectFiles(currentNode)

    // Convert set to array
    const uniqueFiles = Array.from(allFiles)

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = uniqueFiles.slice(startIndex, endIndex)

    // Get metadata and attachment info for paginated files
    const filesWithMetadata = await Promise.all(
      paginatedFiles.map(async (file) => {
        const metadata = await getFileMetadataOnly(file)
        const hasAttachments = await attachmentFolderExists(file)

        // Get the full file content to extract image references in order
        let htmlContent = ""
        if (hasAttachments) {
          try {
            const filePath = path.join(CONTENTS_DIR, file)
            htmlContent = await fs.readFile(filePath, "utf-8")
          } catch (error) {
            console.error(`Error reading file content for ${file}:`, error)
          }
        }

        // Get image attachments for preview if the file has attachments
        const imageAttachments = hasAttachments ? await getImageAttachments(file, htmlContent, 4) : []

        return { file, metadata, hasAttachments, imageAttachments }
      }),
    )

    // Sort by title
    filesWithMetadata.sort((a, b) => (a.metadata.title || a.file).localeCompare(b.metadata.title || b.file))

    return {
      files: filesWithMetadata,
      total: uniqueFiles.length,
      hasMore: endIndex < uniqueFiles.length,
    }
  } catch (error) {
    console.error(`Error getting files for folder ${folderPath}:`, error)
    return { files: [], total: 0, hasMore: false }
  }
}

