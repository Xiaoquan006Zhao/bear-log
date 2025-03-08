// This script generates static JSON files for the HTML viewer app
const fs = require("fs")
const path = require("path")
const { promisify } = require("util")

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)
const mkdir = promisify(fs.mkdir)

const CONTENTS_DIR = path.join(process.cwd(), "contents")
const DATA_DIR = path.join(process.cwd(), "public", "data")

async function ensureDir(dirPath) {
  try {
    await stat(dirPath)
  } catch (error) {
    if (error.code === "ENOENT") {
      await mkdir(dirPath, { recursive: true })
    } else {
      throw error
    }
  }
}

// Extract metadata from HTML content
function extractMetadata(html) {
  const metadata = {
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

// Check if a folder exists for attachments
async function checkAttachmentFolder(htmlFilename) {
  try {
    const baseName = htmlFilename.replace(/\.html$/, "")
    const folderPath = path.join(CONTENTS_DIR, baseName)
    const stats = await stat(folderPath)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

// Extract image references from HTML content
function extractImageReferences(htmlContent) {
  const imageRefs = []
  // Regex to catch various image tag formats
  const regex = /<img\s+[^>]*?src=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp))["'][^>]*>/gi

  let match
  while ((match = regex.exec(htmlContent)) !== null) {
    if (match[1]) {
      // Clean up the path
      const cleanPath = match[1].replace(/^\.\.?\//g, "").trim()
      imageRefs.push(cleanPath)
    }
  }

  return imageRefs
}

// Copy attachment files to public folder and update references
async function processAttachments(htmlFilename, htmlContent) {
  const baseName = htmlFilename.replace(/\.html$/, "")
  const sourceFolderPath = path.join(CONTENTS_DIR, baseName)
  const destFolderPath = path.join(process.cwd(), "public", "attachments", baseName)

  try {
    // Check if source attachment folder exists
    const folderExists = await checkAttachmentFolder(htmlFilename)
    if (!folderExists) {
      return { content: htmlContent, imageAttachments: [] }
    }

    // Ensure destination directory exists
    await ensureDir(destFolderPath)

    // Read source directory
    const files = await readdir(sourceFolderPath)

    // Copy each file
    for (const file of files) {
      const sourceFilePath = path.join(sourceFolderPath, file)
      const destFilePath = path.join(destFolderPath, file)

      try {
        const fileStat = await stat(sourceFilePath)
        if (fileStat.isFile()) {
          // Copy the file
          const fileContent = await readFile(sourceFilePath)
          await writeFile(destFilePath, fileContent)
        }
      } catch (error) {
        console.error(`Error copying file ${file}:`, error)
      }
    }

    // Update HTML content to reference the public path
    const processedHtml = htmlContent.replace(
      /(src|href)=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp|pdf|mp3|mp4))["']/gi,
      (match, attr, path) => {
        // Remove any leading ./ or ../
        const cleanPath = path.replace(/^\.\.?\//g, "")
        // Create the new path
        return `${attr}="/attachments/${encodeURIComponent(baseName)}/${encodeURIComponent(cleanPath)}"`
      },
    )

    // Extract image references for previews
    const imageRefs = extractImageReferences(htmlContent)
    const imageAttachments = imageRefs.slice(0, 4).map((file) => {
      return `/attachments/${encodeURIComponent(baseName)}/${encodeURIComponent(path.basename(file))}`
    })

    return { content: processedHtml, imageAttachments }
  } catch (error) {
    console.error(`Error processing attachments for ${htmlFilename}:`, error)
    return { content: htmlContent, imageAttachments: [] }
  }
}

// Generate folder structure based on file tags
async function generateFolderStructure(files, metadataMap) {
  // Build folder structure based on tags
  const root = {
    name: "root",
    path: "",
    children: {},
    files: [],
    totalUniqueFiles: 0,
  }

  // Process files
  for (const file of files) {
    const metadata = metadataMap[file]

    // Add files without tags to root
    if (!metadata.tags || metadata.tags.trim() === "") {
      root.files.push(file)
      continue
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

    // Set the total count
    node.totalUniqueFiles = uniqueFiles.size
    return uniqueFiles
  }

  calculateFileCounts(root)

  return root
}

// Main function to generate all the static data
async function generateStaticData() {
  try {
    console.log("Starting static data generation...")

    // Ensure data directory exists
    await ensureDir(DATA_DIR)

    // Get all HTML files
    const files = (await readdir(CONTENTS_DIR)).filter((file) => file.toLowerCase().endsWith(".html"))
    console.log(`Found ${files.length} HTML files`)

    // Process each file
    const metadataMap = {}
    const fileDetailsMap = {}

    for (const file of files) {
      console.log(`Processing ${file}...`)
      const filePath = path.join(CONTENTS_DIR, file)
      const content = await readFile(filePath, "utf8")

      // Extract metadata
      const metadata = extractMetadata(content)
      metadataMap[file] = metadata

      // Process attachments and get updated content
      const hasAttachments = await checkAttachmentFolder(file)
      const { content: processedContent, imageAttachments } = hasAttachments
        ? await processAttachments(file, content)
        : { content, imageAttachments: [] }

      // Store file details
      fileDetailsMap[file] = {
        metadata,
        hasAttachments,
        content: processedContent,
        rawHtml: content,
        imageAttachments,
      }

      // Write individual file data to JSON
      await writeFile(
        path.join(DATA_DIR, `${encodeURIComponent(file)}.json`),
        JSON.stringify({
          metadata,
          hasAttachments,
          content: processedContent,
          rawHtml: content,
        }),
      )
    }

    // Generate folder structure
    const folderStructure = await generateFolderStructure(files, metadataMap)

    // Write folder structure to JSON
    await writeFile(path.join(DATA_DIR, "folder-structure.json"), JSON.stringify(folderStructure))

    // Generate files for each folder
    for (const folderPath of getAllFolderPaths(folderStructure)) {
      const filesInFolder = getFilesForFolder(folderStructure, folderPath)
      console.log(`Processing folder: ${folderPath}, found ${filesInFolder.length} files`)

      // Prepare file details for the folder
      const fileDetails = filesInFolder.map((file) => {
        if (!metadataMap[file]) {
          console.warn(`Missing metadata for file: ${file}`)
          return {
            file,
            metadata: {
              title: file,
              created: "",
              modified: "",
              tags: "",
              uniqueId: "",
              lastDevice: "",
            },
            hasAttachments: false,
            imageAttachments: [],
          }
        }

        return {
          file,
          metadata: metadataMap[file],
          hasAttachments: fileDetailsMap[file]?.hasAttachments || false,
          imageAttachments: fileDetailsMap[file]?.imageAttachments || [],
        }
      })

      // Sort by title
      fileDetails.sort((a, b) => (a.metadata.title || a.file).localeCompare(b.metadata.title || b.file))

      // Write folder files to JSON
      const outputPath = path.join(DATA_DIR, `folder-${encodeURIComponent(folderPath || "root")}.json`)
      await writeFile(
        outputPath,
        JSON.stringify({
          files: fileDetails,
          total: fileDetails.length,
          hasMore: false,
        }),
      )
      console.log(`Wrote ${fileDetails.length} files to ${outputPath}`)
    }

    console.log("Static data generation complete!")
  } catch (error) {
    console.error("Error generating static data:", error)
    process.exit(1)
  }
}

// Helper function to get all folder paths
function getAllFolderPaths(folderStructure) {
  const paths = new Set([""]) // Include root

  const traverse = (node, path) => {
    paths.add(path)

    for (const childKey in node.children) {
      const childNode = node.children[childKey]
      traverse(childNode, childNode.path)
    }
  }

  traverse(folderStructure, "")

  return paths
}

// Helper function to get files for a folder
function getFilesForFolder(folderStructure, folderPath) {
  // Find the selected folder
  let currentNode = folderStructure
  if (folderPath !== "") {
    const parts = folderPath.split("/")
    for (const part of parts) {
      if (currentNode.children[part]) {
        currentNode = currentNode.children[part]
      } else {
        console.warn(`Folder path not found: ${folderPath}, part: ${part}`)
        return []
      }
    }
  }

  // Collect all files from this folder and subfolders
  const allFiles = new Set()

  const collectFiles = (node) => {
    // Add this folder's files to the set
    node.files.forEach((file) => allFiles.add(file))

    // Process all children
    for (const childKey in node.children) {
      collectFiles(node.children[childKey])
    }
  }

  collectFiles(currentNode)
  console.log(`Collected ${allFiles.size} files for folder: ${folderPath}`)

  // Convert set to array
  return Array.from(allFiles)
}

// Run the static data generation
generateStaticData().catch(console.error)

