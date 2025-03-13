"use client"
const lunr = require("lunr");

export interface HtmlMetadata {
  title: string
  created: string
  modified: string
  tags: string
  uniqueId: string
  lastDevice: string
  [key: string]: string
}

// Get the list of HTML files from the folder structure in /folders
export async function getFilesList(): Promise<string[]> {
  try {
    // Fetch the folder structure from /folders
    const response = await fetch("folders/folder-structure.json")
    if (!response.ok) {
      throw new Error(`Failed to fetch folder structure: ${response.statusText}`)
    }
    const folderStructure = await response.json()
    // Extract all unique file names from the folder structure
    const files = new Set<string>()
    const collectFiles = (node: any) => {
      node.files?.forEach((file: string) => files.add(file))
      for (const key in node.children) {
        collectFiles(node.children[key])
      }
    }
    collectFiles(folderStructure)
    return Array.from(files)
  } catch (error) {
    console.error("Error reading files list:", error)
    return []
  }
}

// Get the content of a specific HTML file and extract metadata
export async function getFileContent(filename: string): Promise<{
  metadata: HtmlMetadata
  rawHtml: string
  hasAttachments: boolean
}> {
  try {
    // Fetch the file data from the static JSON file
    const response = await fetch(`data/${filename}.json`)
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`)
    }

    const fileData = await response.json()

    return {
      metadata: fileData.metadata,
      rawHtml: fileData.rawHtml,
      hasAttachments: fileData.hasAttachments,
    }
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error)
    throw new Error(`Failed to read file: ${filename}`)
  }
}

// Get only file metadata without full content.
// Since individual file JSON files are no longer generated,
// obtain metadata from the folder structure (e.g. via getFilesForFolder).
export async function getFileMetadataOnly(filename: string): Promise<HtmlMetadata> {
  console.warn(
    "getFileMetadataOnly: Individual file metadata is no longer available separately. " +
      "Please use the folder structure data to obtain metadata."
  )
  return {
    title: filename,
    created: "",
    modified: "",
    tags: "",
    uniqueId: "",
    lastDevice: "",
  }
}

// Get the overall folder structure from /folders
export async function getFolderStructure(): Promise<any> {
  try {
    const response = await fetch("folders/folder-structure.json")
    if (!response.ok) {
      throw new Error(`Failed to fetch folder structure: ${response.statusText}`)
    }
    return await response.json()
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

// Get files for a specific folder from its corresponding JSON file in /folders
export async function getFilesForFolder(
  folderPath: string,
  page = 1,
  limit = 20,
  searchTerm = "",
): Promise<{
  files: { file: string; metadata: HtmlMetadata; hasAttachments: boolean; imageAttachments: string[] }[]
  total: number
  hasMore: boolean
}> {
  try {
    const structureUrl = `folders/${folderPath || ""}/index.json`
    console.log(`Fetching folder files from: ${structureUrl}`)

    const response = await fetch(structureUrl)
    if (!response.ok) {
      console.error(`Failed to fetch folder files: ${response.status} ${response.statusText}`)
      return { files: [], total: 0, hasMore: false }
    }
    const folderData = await response.json()
    const startIndex = (page - 1) * limit
    const endIndex = Math.min(startIndex + limit, folderData.files?.length || 0)

    if (searchTerm != "") {
      console.log(`Searching for term: ${searchTerm}`)

      const searchIndexUrl = `folders/${folderPath || ""}/search-index.json`
      const response = await fetch(searchIndexUrl)
      if (!response.ok) {
        console.error(`Failed to fetch search index: ${response.status} ${response.statusText}`)
        return { files: [], total: 0, hasMore: false }
      }

      const searchIndexJson = await response.json()
      const searchIndex = lunr.Index.load(searchIndexJson);

      let lunrSearchTerm = ""
      for (const term of searchTerm.trim().split(" ")) {
        lunrSearchTerm += `*${term} ${term}* *${term}* ${term} `
      }

      const results = searchIndex.search(lunrSearchTerm);
      console.log(`Search results:`, results) 
      const filteredFiles = folderData.files?.filter((fileInstance: any) => {
        return results.some((result: any) => {
          return result.ref == fileInstance.file;
        });
      });

      const filteredPaginatedFiles = filteredFiles?.slice(startIndex, endIndex) || []

      const filteredTotal = filteredFiles?.length || 0
      const filteredHasMore = endIndex < filteredTotal
      return {
        files: filteredPaginatedFiles,
        total: filteredTotal,
        hasMore: filteredHasMore,
      }
    }
    const paginatedFiles = folderData.files?.slice(startIndex, endIndex) || []

    return {
      files: paginatedFiles,
      total: folderData.files?.length || 0,
      hasMore: endIndex < (folderData.files?.length || 0),
    }
  } catch (error) {
    console.error(`Error getting files for folder ${folderPath}:`, error)
    return { files: [], total: 0, hasMore: false }
  }
}

