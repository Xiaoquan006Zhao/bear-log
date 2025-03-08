"use server"

import fs from "fs/promises"
import path from "path"


import { CONTENTS_DIR } from "@/app/page"

// Add caching for attachment existence checks to improve performance
const attachmentFolderCache = new Map<string, boolean>()

// Check if an attachment folder exists for a given HTML file
export async function attachmentFolderExists(htmlFilename: string): Promise<boolean> {
  try {
    // Check cache first
    if (attachmentFolderCache.has(htmlFilename)) {
      return attachmentFolderCache.get(htmlFilename)!
    }

    // Remove .html extension to get the base name
    const baseName = htmlFilename.replace(/\.html$/, "")
    const folderPath = path.join(CONTENTS_DIR, baseName)

    // Check if the folder exists
    const stats = await fs.stat(folderPath)
    const exists = stats.isDirectory()

    // Cache the result
    attachmentFolderCache.set(htmlFilename, exists)

    return exists
  } catch (_) {
    // If error, folder doesn't exist
    attachmentFolderCache.set(htmlFilename, false)
    return false
  }
}

// Add a function to clear the cache when needed
export async function clearAttachmentCache() {
  attachmentFolderCache.clear()
}

// Get an attachment file
export async function getAttachmentFile(
  htmlFilename: string,
  attachmentPath: string,
): Promise<{
  buffer: Buffer
  contentType: string
}> {
  try {
    // Remove .html extension to get the base name
    const baseName = htmlFilename.replace(/\.html$/, "")

    // Fix the path to avoid duplication
    // Check if the attachmentPath already starts with the base name
    const cleanAttachmentPath = attachmentPath.startsWith(baseName + "/")
      ? attachmentPath.substring(baseName.length + 1) // +1 for the slash
      : attachmentPath

    const fullPath = path.join(CONTENTS_DIR, baseName, cleanAttachmentPath)

    console.log(`Attempting to read file: ${fullPath}`)

    // Read the file
    const buffer = await fs.readFile(fullPath)

    // Determine content type based on file extension
    const contentType = await getContentType(attachmentPath)

    return { buffer, contentType }
  } catch (error) {
    console.error(`Error reading attachment ${attachmentPath} for ${htmlFilename}:`, error)
    throw new Error(`Failed to read attachment: ${attachmentPath}`)
  }
}

// Helper to determine content type based on file extension
async function getContentType(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase()

  const contentTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".txt": "text/plain",
    ".json": "application/json",
    ".xml": "application/xml",
    ".zip": "application/zip",
  }

  return contentTypes[extension] || "application/octet-stream"
}

// Process HTML content to fix attachment paths
export async function processHtmlContent(htmlContent: string, htmlFilename: string): Promise<string> {
  // Remove .html extension to get the base name
  const baseName = htmlFilename.replace(/\.html$/, "")

  // Replace relative image paths with API route paths
  return htmlContent.replace(
    /(src|href)=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp|pdf|mp3|mp4))["']/gi,
    (match, attr, path) => {
      // If path already starts with the API route, don't modify it
      if (path.startsWith(`/api/attachments/${baseName}/`)) {
        return match
      }

      // Remove any leading ./ or ../
      const cleanPath = path.replace(/^\.\.?\//g, "")

      // Create the new path using the API route
      return `${attr}="/api/attachments/${encodeURIComponent(baseName)}/${encodeURIComponent(cleanPath)}"`
    },
  )
}

// Extract image references from HTML content in order
export async function extractImageReferences(htmlContent: string): Promise<string[]> {
  const imageRefs: string[] = []
  // More comprehensive regex to catch various image tag formats
  const regex = /<img\s+[^>]*?src=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp))["'][^>]*>/gi

  let match
  while ((match = regex.exec(htmlContent)) !== null) {
    if (match[1]) {
      // Clean up the path more thoroughly
      const cleanPath = match[1].replace(/^\.\.?\//g, "").trim()
      imageRefs.push(cleanPath)
    }
  }

  // Log for debugging
  console.log("Extracted image references:", imageRefs)
  return imageRefs
}

// Get image attachments for a file (for preview)
export async function getImageAttachments(htmlFilename: string, htmlContent = "", limit = 2): Promise<string[]> {
  try {
    // Remove .html extension to get the base name
    const baseName = htmlFilename.replace(/\.html$/, "")
    const folderPath = path.join(CONTENTS_DIR, baseName)

    // Check if the folder exists
    const exists = await attachmentFolderExists(htmlFilename)
    if (!exists) {
      return []
    }

    // Read the directory
    const files = await fs.readdir(folderPath)

    // Filter for image files only
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })

    console.log(`Found ${imageFiles.length} image files for ${htmlFilename}`)

    // If we have HTML content, extract image references to maintain order
    if (htmlContent) {
      const imageRefs = await extractImageReferences(htmlContent)
      console.log(`Extracted ${imageRefs.length} image references from HTML`)

      // If we found image references, use them to order the files
      if (imageRefs.length > 0) {
        // Create a map of filenames to their positions in the HTML
        const filePositions = new Map<string, number>()

        // Process each reference
        imageRefs.forEach((ref, index) => {
          // Get just the filename part
          const filename = path.basename(ref)
          filePositions.set(filename, index)

          // Also store the full path for more accurate matching
          filePositions.set(ref, index)
        })

        console.log("File positions map:", Object.fromEntries(filePositions))

        // Sort the image files based on their position in the HTML
        const sortedFiles = [...imageFiles].sort((a, b) => {
          // Try multiple matching strategies
          const posA = filePositions.has(a)
            ? filePositions.get(a)!
            : filePositions.has(path.basename(a))
              ? filePositions.get(path.basename(a))!
              : Number.MAX_SAFE_INTEGER

          const posB = filePositions.has(b)
            ? filePositions.get(b)!
            : filePositions.has(path.basename(b))
              ? filePositions.get(path.basename(b))!
              : Number.MAX_SAFE_INTEGER

          return posA - posB
        })

        console.log("Sorted files:", sortedFiles)

        // Limit the number of images
        const limitedImages = sortedFiles.slice(0, limit)

        // Create API paths for the images
        return limitedImages.map(
          (file) => `/api/attachments/${encodeURIComponent(baseName)}/${encodeURIComponent(file)}`,
        )
      }
    }

    // Fallback to alphabetical order if we couldn't extract references
    const limitedImages = imageFiles.slice(0, limit)

    // Create API paths for the images
    return limitedImages.map((file) => `/api/attachments/${encodeURIComponent(baseName)}/${encodeURIComponent(file)}`)
  } catch (error) {
    console.error(`Error getting image attachments for ${htmlFilename}:`, error)
    return []
  }
}

