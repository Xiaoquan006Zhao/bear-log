// This script generates static JSON files for the HTML viewer app,
// deleting previous generated folders (html, folders, and attachments)
// so that every generation is new. Processed HTML files are moved to the html folder,
// and folder JSON files are written into a separate folders folder.
const fs = require("fs")
const path = require("path")
const { promisify } = require("util")
const { marked } = require("marked")

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)
const mkdir = promisify(fs.mkdir)

const CONTENTS_DIR = path.join(process.cwd(), "contents")
const HTML_OUTPUT_DIR = path.join(process.cwd(), "public", "data")
const FOLDERS_DIR = path.join(process.cwd(), "public", "folders")
const ATTACHMENTS_DIR = path.join(process.cwd(), "public", "data")
const ATTACHMENTS_URL = "data" // Global declaration for URL prefix
const SCRIPTS_DIR = path.join(process.cwd(), "scripts")


function processHashtags(htmlContent) {
  // Regular expression for finding hashtags with segments separated by /
  const hashtagRegex = /<p>(#[^<\s]+(?:\/[^<\s]+)*)<\/p>/g;
  
  // Initialize variables to store overall processed content and generated tags
  let generatedTags = "";
  let processedHtmlContent = htmlContent.replace(hashtagRegex, (match, hashtag) => {
    // Split the hashtag by / character
    const segments = hashtag.split('/');
    
    let tags = "";
    let currentTag = "";
    for (let i = 0; i < segments.length; i++) {
      currentTag += (currentTag === "" ? segments[i].substring(1) : "/" + segments[i]);
      tags = (tags === "" ? currentTag : currentTag + ", ") + tags;
    }

    generatedTags = tags;
    
    // Format the hashtag with the first segment and the separator markers
    let formattedHashtag = `<span class='hashtag'><span class='hashtag-marker marker'>#</span>${segments[0].substring(1)}`;
    
    // Add the remaining segments with separator markers
    for (let i = 1; i < segments.length; i++) {
      formattedHashtag += `<span class='hashtag-separator-marker marker'>/</span>${segments[i]}`;
    }
    
    formattedHashtag += '</span>';
    
    return `<p>${formattedHashtag}</p>`;
  });

  return {
    generatedTags,
    processedHtmlContent
  };
}

async function convertMarkdownToHtml(markdownPath, filename) {
  try {
    const markdown = await readFile(markdownPath, "utf8")
    const styleTemplate = await readFile(path.join(SCRIPTS_DIR, "style-template.html"), "utf8")

    let styleTag = "";
    const styleMatch = styleTemplate.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch && styleMatch[1]) {
      styleTag = `<style>${styleMatch[1]}</style>`;
    }
    
    // Extract any frontmatter metadata if present (simple implementation)
    let content = markdown
    let metadata = {
      title: path.basename(filename, ".md"),
      created: "unavailable",
      modified: "unavailable",
      tags: "",
      uniqueId: `md-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      lastDevice: "Markdown Import"
    }
    
    // Check for frontmatter between --- markers
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/)
    if (frontmatterMatch) {
      content = markdown.substring(frontmatterMatch[0].length)
      const frontmatter = frontmatterMatch[1]
      
      // Parse frontmatter
      frontmatter.split("\n").forEach(line => {
        const [key, value] = line.split(":").map(part => part.trim())
        if (key && value) {
          metadata[key.toLowerCase()] = value
        }
      })
    }
    
    // Convert Markdown to HTML
    const htmlContent = marked.parse(content)
    const { generatedTags, processedHtmlContent } = processHashtags(htmlContent)
    console.log(generatedTags);
    metadata.tags = generatedTags;
    // Create a complete HTML document with metadata
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${metadata.title}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="bear-note-unique-identifier" content="${metadata.uniqueId}">
  <meta name="created" content="${metadata.created}">
  <meta name="modified" content="${metadata.modified}">
  <meta name="tags" content="${metadata.tags}">
  <meta name="last device" content="${metadata.lastDevice}">
  ${styleTag}
  </head>
<body>
<div class="document-wrapper">
${processedHtmlContent}
<br>
<br>
<br>
</div>
</body>
</html>`

    // Generate the output filename and path
    const htmlFileName = path.basename(filename, '.md') + '.html';
    const htmlFilePath = path.join(CONTENTS_DIR, htmlFileName);
    
    // Write the HTML content to a file
    await writeFile(htmlFilePath, fullHtml);
    console.log(`Written HTML file: ${htmlFilePath}`);
  } catch (error) {
    console.error(`Error converting markdown file ${markdownPath}:`, error)
    return null
  }
}

// Delete a folder and all its contents
async function deleteFolder(folderPath) {
  try {
    await fs.promises.rm(folderPath, { recursive: true, force: true })
    console.log(`Deleted folder: ${folderPath}`)
  } catch (error) {
    console.error(`Error deleting folder ${folderPath}:`, error)
  }
}

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
  const regex = /<img\s+[^>]*?src=["'](?!https?:\/\/)([^"']+\.(png|jpg|jpeg|gif|svg|webp))["'][^>]*>/gi
  let match
  while ((match = regex.exec(htmlContent)) !== null) {
    if (match[1]) {
      const cleanPath = match[1].replace(/^\.\.?\//g, "").trim()
      imageRefs.push(cleanPath)
    }
  }
  return imageRefs
}


// ...

async function processAttachments(htmlFilename, htmlContent) {
  const baseName = htmlFilename.replace(/\.html$/, "")
  const sourceFolderPath = path.join(CONTENTS_DIR, baseName)
  // Use the raw baseName for file system copy into the data/ folder
  const destFolderPath = path.join(ATTACHMENTS_DIR, baseName)
  try {
    const folderExists = await checkAttachmentFolder(htmlFilename)
    if (!folderExists) {
      return {imageAttachments: [] }
    }
    await ensureDir(destFolderPath)

    const files = await readdir(sourceFolderPath)
    for (const file of files) {
      const sourceFilePath = path.join(sourceFolderPath, file)
      const destFilePath = path.join(destFolderPath, file)
      
      try {
        const fileStat = await stat(sourceFilePath)
        if (fileStat.isFile()) {
          const fileContent = await readFile(sourceFilePath)
          await writeFile(destFilePath, fileContent)
        }
      } catch (error) {
        console.error(`Error copying file ${file}:`, error)
      }
    }
    const imageRefs = extractImageReferences(htmlContent)
    const imageAttachments = imageRefs.slice(0, 4).map((file) => {
      return `${ATTACHMENTS_URL}/${baseName}/${path.basename(file)}`
    })
    return {imageAttachments }
  } catch (error) {
    console.error(`Error processing attachments for ${htmlFilename}:`, error)
    return {imageAttachments: [] }
  }
}


// Generate folder structure based on file tags
async function generateFolderStructure(files, metadataMap) {
  const root = {
    name: "root",
    path: "",
    children: {},
    files: [],
    totalUniqueFiles: 0,
  }
  for (const file of files) {
    const metadata = metadataMap[file]
    if (!metadata.tags || metadata.tags.trim() === "") {
      root.files.push(file)
      continue
    }
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
        if (j === parts.length - 1 && !currentNode.files.includes(file)) {
          currentNode.files.push(file)
        }
      }
    }
  }
  const calculateFileCounts = (node) => {
    const uniqueFiles = new Set(node.files)
    for (const childKey in node.children) {
      const childNode = node.children[childKey]
      const childUniqueFiles = calculateFileCounts(childNode)
      childUniqueFiles.forEach((file) => uniqueFiles.add(file))
    }
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

    // Delete previously generated folders before populating them
    await deleteFolder(HTML_OUTPUT_DIR)
    await deleteFolder(FOLDERS_DIR)
    await deleteFolder(ATTACHMENTS_DIR)

    // Ensure data directories exist
    await ensureDir(HTML_OUTPUT_DIR)
    await ensureDir(FOLDERS_DIR)
    await ensureDir(ATTACHMENTS_DIR)

    // Convert all markdown files to HTML
    const markdownFiles = (await readdir(CONTENTS_DIR)).filter((file) => file.toLowerCase().endsWith(".md"))
    for (const file of markdownFiles) {
      const filePath = path.join(CONTENTS_DIR, file)
      await convertMarkdownToHtml(filePath, file)
    }


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
      const { imageAttachments } = hasAttachments
        ? await processAttachments(file, content)
        : {imageAttachments: [] }

      // Store file details
      fileDetailsMap[file] = {
        metadata,
        hasAttachments,
        rawHtml: content,
        imageAttachments,
      }

      // Write individual file data to JSON using the raw file name.
      await writeFile(
        path.join(HTML_OUTPUT_DIR, `${file}.json`),
        JSON.stringify({
          metadata,
          hasAttachments,
          rawHtml: content,
        }),
      )
    }

    // Generate folder structure
    const folderStructure = await generateFolderStructure(files, metadataMap)

    // Write the overall folder structure to JSON
    await writeFile(path.join(FOLDERS_DIR, "folder-structure.json"), JSON.stringify(folderStructure))

    // Generate individual JSON files for each folder, mirroring the tag hierarchy.
    for (const folderPath of getAllFolderPaths(folderStructure)) {
      const filesInFolder = getFilesForFolder(folderStructure, folderPath)
      console.log(`Processing folder: ${folderPath || "root"}, found ${filesInFolder.length} files`)

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

      // Determine output path:
      // For the root folder (empty string) write to FOLDERS_DIR/index.json.
      // For nested folders, create corresponding nested directories and write an index.json file.
      let outputPath
      if (folderPath === "") {
        outputPath = path.join(FOLDERS_DIR, "index.json")
      } else {
        const parts = folderPath.split("/")
        const folderDir = path.join(FOLDERS_DIR, ...parts)
        await ensureDir(folderDir)
        outputPath = path.join(folderDir, "index.json")
      }

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

// Helper function to get all folder paths from the folder structure.
// Returns folder paths as strings (e.g. "", "foo", "foo/bar", etc.)
function getAllFolderPaths(folderStructure) {
  const paths = new Set([""]) // Include root

  const traverse = (node, currentPath) => {
    paths.add(currentPath)
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

  // Collect all files from this folder and its subfolders
  const allFiles = new Set()
  const collectFiles = (node) => {
    node.files.forEach((file) => allFiles.add(file))
    for (const childKey in node.children) {
      collectFiles(node.children[childKey])
    }
  }
  collectFiles(currentNode)
  console.log(`Collected ${allFiles.size} files for folder: ${folderPath || "root"}`)
  return Array.from(allFiles)
}

// Run the static data generation
generateStaticData().catch(console.error)
